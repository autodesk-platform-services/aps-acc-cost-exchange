/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Autodesk Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

'use strict';   


var express = require('express'); 
var router = express.Router(); 

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json(); 

const crypto = require('crypto');

// const { createHmac } = require('node:crypto');

var config = require('../config'); 

const { apiClientCallAsync } = require('./common/apiclient');
const { OAuth } = require('./common/oauth');


const SocketEnum = {
  COST_EVENTS: 'cost events'
};

const CostEventObjects =[
'budget',
'budgetPayment',
'contract',
'cor',
'costPayment',
'expense',
'expenseItem',
'mainContract',
'mainContractItem',
'oco',
'pco',
'rfq',
'scheduleOfValue',
'sco'
]

const CostEventVersion = "-1.0";
const CostEventSystemId = "autodesk.construction.cost";


/////////////////////////////////////////////////////////////////////////////
// Add String.format() method if it's not existing
if (!String.prototype.format) {
  String.prototype.format = function () {
      var args = arguments;
      return this.replace(/{(\d+)}/g, function (match, number) {
          return typeof args[number] != 'undefined'
              ? args[number]
              : match
              ;
      });
  };
}


const TokenType = {
  TWOLEGGED: 0,
  THREELEGGED: 1,
  NOT_SUPPORTED: 9
}

const WEBHOOKS_SECRET = "autodesktoken";

function verifySignature(req, res, buf, encoding) {
  const signature = req.header('x-adsk-signature');
  if (!signature) { return; }

  // use utf-8 encoding by default
  const body = buf.toString(encoding);
  const hmac = crypto.createHmac('sha1', WEBHOOKS_SECRET);
  const calcSignature = 'sha1hash=' + hmac.update(body).digest('hex');
  req.signature_match = (calcSignature === signature);
}


///////////////////////////////////////////////////////////////////////
/// Middleware for obtaining a token for each request.
///////////////////////////////////////////////////////////////////////
router.use( async (req, res, next) => {
  const oauth = new OAuth(req.session);
  req.oauth_client = oauth.getClient();
  req.oauth_token = await oauth.getInternalToken();  
  next();   
});


/////////////////////////////////////////////////////////////////////////////////////////////
/// get different data of cost type
/////////////////////////////////////////////////////////////////////////////////////////////
router.get('/cost/info', jsonParser, async function (req, res) {
  const containerId = req.query.costContainerId;
  if (!containerId) {
    console.error('cost container id is not provide.');
    return (res.status(400).json({
      diagnostic: 'cost container id is not provide.'
    }));
  }  

  let costUrl = null;
  const costType = req.query.costType;
  switch( costType ){
    case 'budget':{
      costUrl =  config.bim360Cost.URL.BUDGETS_URL.format(containerId);
      break;
    };
    case 'contract':{
      costUrl =  config.bim360Cost.URL.CONTRACTS_URL.format(containerId);
      break;
    }
    case 'costitem':{
      costUrl =  config.bim360Cost.URL.COSTITEMS_URL.format(containerId);
      break;
    }  
    case 'pco':
    case 'rfq':
    case 'rco':
    case 'oco':
    case 'sco':{
      costUrl =  config.bim360Cost.URL.CHANGEORDERS_URL.format(containerId, costType);
      break;
    } 
  };
  let costInfoRes = null;
  try {
    costInfoRes = await apiClientCallAsync('GET', costUrl, req.oauth_token.access_token);
  } catch (err) {
    console.error(err)
    return (res.status(500).json({
      diagnostic: 'failed to get the cost info'
    }));
  }
  return (res.status(200).json(costInfoRes.body.results));
})



/////////////////////////////////////////////////////////////////////////////////////////////
/// update cost data
/////////////////////////////////////////////////////////////////////////////////////////////
router.post('/cost/info', jsonParser, async function (req, res) {
  const containerId = req.body.costContainerId;
  const costType = req.body.costType;
  const requestData = req.body.requestData;
  if (!containerId || !costType || !requestData || !requestData.id) {
    console.error('missing parameters in request body');
    return (res.status(400).json({
      diagnostic: 'missing parameters in request body'
    }));
  }

  let costUrl = null;
  switch (costType) {
    case 'budget': {
      costUrl = config.bim360Cost.URL.BUDGET_URL.format(containerId, requestData.id);
      break;
    };
    case 'contract': {
      costUrl = config.bim360Cost.URL.CONTRACT_URL.format(containerId, requestData.id);
      break;
    }
    case 'costitem': {
      costUrl = config.bim360Cost.URL.COSTITEM_URL.format(containerId, requestData.id);
      break;
    }
    case 'pco':
    case 'rfq':
    case 'rco':
    case 'oco':
    case 'sco': {
      costUrl = config.bim360Cost.URL.CHANGEORDER_URL.format(containerId, costType, requestData.id);
      break;
    }
  };
  let costInfoRes = null;
  try {
    costInfoRes = await apiClientCallAsync('PATCH', costUrl, req.oauth_token.access_token, req.body.requestData);
  } catch (err) {
    console.error(err);
    return (res.status(500).json({
      diagnostic: 'failed to update the cost info'
    }));
  }
  return (res.status(200).json(costInfoRes.body));
})


/////////////////////////////////////////////////////////////////////////////////////////////
/// get read data for the input Id 
/////////////////////////////////////////////////////////////////////////////////////////////
router.get('/bim360/type/:typeId/id/:valueId', jsonParser, async function(req, res){
  const typeId = req.params.typeId;
  const valueId = req.params.valueId;
  let requestUrl = null;
  let tokenType = TokenType.TWOLEGGED;

  switch (typeId) {
    case 'companyId': {
      const params = req.query.projectHref.split('/');
      if(params.length < 3){
        console.error('input project id is not correct.');
        return (res.status(400).json({
          diagnostic: 'input project is not correct'
        }));
      }
      const projectId = params[params.length - 1];
      const pureProjectId = projectId.split('b.').join('');
      const hubId = params[params.length - 3];
      const accountId = hubId.split('b.').join('');
      requestUrl = config.accountv1.URL.COMPANY_URL.format(accountId, pureProjectId);
      tokenType = TokenType.TWOLEGGED;
      break;
    }
    case 'creatorId':
    case 'changedBy':
    case 'contactId':
    case 'signedBy':
    case 'recipients':
    case 'ownerId': {
      const params = req.query.projectHref.split('/');
      if(params.length < 3){
        console.error('input project id is not correct.');
        return (res.status(400).json({
          diagnostic: 'input project is not correct'
        }));
      }
      const hubId = params[params.length - 3];
      const accountId = hubId.split('b.').join('');
      requestUrl = config.accountv1.URL.USER_URL.format(accountId, valueId);
      tokenType = TokenType.TWOLEGGED;
      break;
    }

    case 'contractId': {
      var containerId = req.query.costContainerId;
      if (!containerId) {
        console.error('input container id is not correct.');
        return (res.status(400).json({
          diagnostic: 'input container id is not correct'
        }));
      }
      requestUrl = config.bim360Cost.URL.CONTRACT_URL.format(containerId, valueId);
      tokenType = TokenType.THREELEGGED;
      break;
    }

    case 'parentId': 
    case 'rootId':
    case 'budgets':
    case 'budget':
    case 'budgetId':{
      var containerId = req.query.costContainerId;
      if(!containerId){  
        console.error('input container id is not correct.');
        return (res.status(400).json({
          diagnostic: 'input container id is not correct'
        }));
      }  
      requestUrl = config.bim360Cost.URL.BUDGET_URL.format(containerId, valueId);
      tokenType = TokenType.THREELEGGED;
      break;
    }
  }
  let token = null;
  if( tokenType === TokenType.TWOLEGGED ){
    const oauth = new OAuth(req.session);
    const oauth_client = oauth.get2LeggedClient(); 
    const oauth_token = await oauth_client.authenticate();
    token = oauth_token.access_token;
  }else{
    token = req.oauth_token.access_token;
  }
  let response = null;
  try {
    response = await apiClientCallAsync( 'GET',  requestUrl, token);
  } catch (err) {
    console.error( err );
    return (res.status(500).json({
      diagnostic: 'failed to get the real data for the id'
    }));
  }
  let detailRes = response.body;
  // handle 'companyId' as a special case
  let companyInfo = {};
  if(typeId === 'companyId' ){
    for( let companyItem in detailRes ){
      if( detailRes[companyItem].member_group_id === valueId ){
        companyInfo.name = detailRes[companyItem].name;
        break;
      }
    }
    detailRes = companyInfo;
  }
  return (res.status(200).json(detailRes));
})


/////////////////////////////////////////////////////////////////////////////////////////////
/// update the custom attributes
/////////////////////////////////////////////////////////////////////////////////////////////
router.post('/cost/attribute',jsonParser, async function (req, res) {
  const containerId = req.body.costContainerId;
  const requestData = req.body.requestData;
  if(!containerId || !requestData){  
    console.error('containerId or requestData is not provided.');
    return (res.status(400).json({
      diagnostic: 'containerId or requestData is not provided in request body'
    }));
  }  
  const costUrl = config.bim360Cost.URL.CUSTOM_ATTRIBUTE_URL.format(containerId);

  let costInfoRes = null;
  try {
    costInfoRes = await apiClientCallAsync('POST', costUrl, req.oauth_token.access_token, requestData);
  } catch (err) {
    console.error(err)
    return (res.status(500).json({
      diagnostic: 'failed to update custom attribute'
    }));
  }
  res.status(200).json(costInfoRes.body);
})



/////////////////////////////////////////////////////////////////////////////////////////////
/// Get cost webhook events
/////////////////////////////////////////////////////////////////////////////////////////////
router.get('/project/:projectId/cost/events', jsonParser, async function (req, res) {
  const projectId = req.params.projectId;
  if (!projectId) {
    console.error('Project id is not provided.');
    return (res.status(400).json({
      diagnostic: 'Project id is not provided.'
    }));
  }

  const projectIdWithoutB = projectId.replace("b.", "");
  const costEventsUrl = config.bim360Cost.URL.COST_HOOKS.format(CostEventSystemId);
  try {
    const webHooks = await apiClientCallAsync("GET", costEventsUrl, req.oauth_token.access_token);
    const projectHooks = webHooks.body.data.filter(node => node.scope.project == projectIdWithoutB)
    res.status(200).json(projectHooks);
  } catch (err) {
    console.error(err)
    return (res.status(500).json({
      diagnostic: 'failed to unregister cost webhooks'
    }));
  }
})



/////////////////////////////////////////////////////////////////////////////////////////////
/// Create cost webhook events
/////////////////////////////////////////////////////////////////////////////////////////////
router.post('/project/:projectId/cost/events', jsonParser, async function (req, res) {
  const projectId = req.params.projectId;
  if (!projectId) {
    console.error('Project id is not provided.');
    return (res.status(400).json({
      diagnostic: 'Project id is not provided.'
    }));
  }
  const projectIdWithoutB = projectId.replace("b.", "");
  await Promise.all(CostEventObjects.map(async costObject => {
    const costObjectCreatedUrl = config.bim360Cost.URL.COST_EVENTS_HOOKS.format(CostEventSystemId, costObject + '.created' + CostEventVersion);
    const costObjectDeletedUrl = config.bim360Cost.URL.COST_EVENTS_HOOKS.format(CostEventSystemId, costObject + '.deleted' + CostEventVersion);
    const costObjectUpdatedUrl = config.bim360Cost.URL.COST_EVENTS_HOOKS.format(CostEventSystemId, costObject + '.updated' + CostEventVersion);
    const requestBody = {
      'callbackUrl': config.credentials.callback_cost_events,
      'scope': {
        'project': projectIdWithoutB
      }
    }
    try {
      await apiClientCallAsync('POST', costObjectCreatedUrl, req.oauth_token.access_token, requestBody);
      await apiClientCallAsync('POST', costObjectDeletedUrl, req.oauth_token.access_token, requestBody);
      await apiClientCallAsync('POST', costObjectUpdatedUrl, req.oauth_token.access_token, requestBody);
    } catch (err) {
      console.error('failed to create cost webhook of ' + costObject);
    }
  })
  )  
  res.status(201).json({ status: 201 });
})



/////////////////////////////////////////////////////////////////////////////////////////////
/// Unregister cost webhook events
/////////////////////////////////////////////////////////////////////////////////////////////
router.delete('/project/:projectId/cost/events', jsonParser, async function (req, res) {
  const projectId = req.params.projectId;
  if (!projectId) {
    console.error('Project id is not provided.');
    return (res.status(400).json({
      diagnostic: 'Project id is not provided.'
    }));
  }  
  
  const projectIdWithoutB = projectId.replace("b.","");
  const costEventsUrl = config.bim360Cost.URL.COST_HOOKS.format( CostEventSystemId);
  try{
    const webHooks = await apiClientCallAsync("GET", costEventsUrl, req.oauth_token.access_token );
    await Promise.all(
      webHooks.body.data.map( async (hook) => {
        if( hook.scope.project != projectIdWithoutB)
          return null;
        try{
          const hookUrl = config.bim360Cost.URL.COST_EVENTS_HOOK.format(CostEventSystemId,hook.event, hook.hookId)
          await apiClientCallAsync("DELETE", hookUrl, req.oauth_token.access_token);
        }catch(err){
          console.log(err);
        }
      })
    )
  } catch (err) {
    console.error(err)
    return (res.status(500).json({
      diagnostic: 'failed to unregister cost webhooks'
    }));
  }
  res.status(204).json({status:204});
  return;
})



// /////////////////////////////////////////////////////////////////////
// / Get budget code template
// /////////////////////////////////////////////////////////////////////
router.post('/callback/events', express.json({
  inflate: true,
  limit: '1024kb',
  type: 'application/json',
  verify: verifySignature
}), async (req, res) => {
  
  if(!req.signature_match) {
    return res.status(403).send('not called from webhooks service');
  }

  res.status(204).send();

  if (req.body && req.body.hook && req.body.hook.event) {

    const params = req.body.hook.event.replace(CostEventVersion, '').split('.');
    const eventObject = params[0];
    const eventAction = params[params.length - 1];

    // send the event object to client
    const costEventInfo = {
      'CostObject': eventObject,
      'CostAction': eventAction
    };
    global.MyApp.SocketIo.emit(SocketEnum.COST_EVENTS, costEventInfo);
  }
})


module.exports = router
