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

$(document).ready(function () {
  // first, check if current visitor is signed in
  jQuery.ajax({
    url: '/api/aps/oauth/token',
    success: function (res) {
      // yes, it is signed in...
      $('#autodeskSignOutButton').show();
      $('#autodeskSigninButton').hide();

      $('#refreshSourceHubs').show();
      


      // prepare sign out
      $('#autodeskSignOutButton').click(function () {
        $('#hiddenFrame').on('load', function (event) {
          location.href = '/api/aps/oauth/signout';
        });
        $('#hiddenFrame').attr('src', 'https://accounts.autodesk.com/Authentication/LogOut');
      })

      // and refresh button
      $('#refreshSourceHubs').click(function () {
        $('#sourceHubs').jstree(true).refresh();
      });

      prepareUserHubsTree();
      showUser();
    },
    error: function(err){
      $('#autodeskSignOutButton').hide();
      $('#autodeskSigninButton').show();
    }
  });

  $('#autodeskSigninButton').click(function () {
    jQuery.ajax({
      url: '/api/aps/oauth/url',
      success: function (url) {
        location.href = url;
      }
    });
  })


  $.getJSON("/api/aps/oauth/clientid", function (res) {
    $("#ClientID").val(res.id);
    $("#provisionAccountSave").click(function () {
      $('#provisionAccountModal').modal('toggle');
      $('#sourceHubs').jstree(true).refresh();
    });
  });  

});



function prepareUserHubsTree() {
  $('#sourceHubs').jstree({
      'core': {
          'themes': { "icons": true },
          'multiple': false,
          'data': {
              "url": '/api/aps/datamanagement',
              "dataType": "json",
              'cache': false,
              'data': function (node) {
                  $('#sourceHubs').jstree(true).toggle_node(node);
                  return { "id": node.id };
              }
          }
      },
      'types': {
          'default': { 'icon': 'glyphicon glyphicon-question-sign' },
          '#': { 'icon': 'glyphicon glyphicon-user' },
          'bim360Hubs': { 'icon': 'https://cdn.autodesk.io/dm/xs/bim360hub.png' },
          'bim360projects': { 'icon': 'https://cdn.autodesk.io/dm/xs/bim360project.png' },
          'accprojects': { 'icon': 'https://cdn.autodesk.io/dm/xs/bim360project.png' },
          'unsupported': { 'icon': 'glyphicon glyphicon-ban-circle' }
      },
      "sort": function (a, b) {
          var a1 = this.get_node(a);
          var b1 = this.get_node(b);
          var parent = this.get_node(a1.parent);
          if (parent.type === 'items') { // sort by version number
              var id1 = Number.parseInt(a1.text.substring(a1.text.indexOf('v') + 1, a1.text.indexOf(':')))
              var id2 = Number.parseInt(b1.text.substring(b1.text.indexOf('v') + 1, b1.text.indexOf(':')));
              return id1 > id2 ? 1 : -1;
          }
          else if (a1.type !== b1.type) return a1.icon < b1.icon ? 1 : -1; // types are different inside folder, so sort by icon (files/folders)
          else return a1.text > b1.text ? 1 : -1; // basic name/text sort
      },
      "plugins": ["types", "state", "sort", "contextmenu"],
      contextmenu: { items: autodeskMenuSource },
      "state": { "key": "sourceHubs" }// key restore tree state
  }).on('select_node.jstree', function(evt, data){
    if (data != null && data.node != null && (data.node.type == 'bim360projects' || data.node.type == 'accprojects' ) ) {
      $('#labelProjectHref').text(data.node.id);
      $('#labelCostContainer').text(data.node.original.cost_container);

      // create the cost table when project is selected.
      if( g_costTable != null ){
        delete g_costTable;
        g_costTable = null;
      }
      g_costTable = new CostTable('#budgetsTable', data.node.original.cost_container, data.node.id, CostDataType.BUDGET);

      if( g_costEventsTable != null ){
        delete g_costEventsTable;
        g_costEventsTable = null;
      }   
      const params = data.node.id.split('/');
      const projectId = params[params.length - 1].replace('b.', '');
      g_costEventsTable = new CostEventsTable('#costEventsTable', projectId);

      $('#btnRefresh').click();
    }
  }); 
}



/////////////////////////////////////////////////////////////
// Context menu for the project node
function autodeskMenuSource(autodeskNode) {
  var items;

  switch (autodeskNode.type) {
    case "bim360projects":
    case "accprojects":
      items = {
        registerEvents: {
          label: "Register cost webhook events",
          action: function () {
            registerEvents(autodeskNode);
          },
          icon: 'glyphicon glyphicon-registration-mark'
        },
        unregisterEvents:{
          label: "Unregister cost webhook events",
          action: function () {
            unregisterEvents(autodeskNode);
          },
          icon: 'glyphicon glyphicon-remove-circle'
        }
      };
      break;
  }
  return items;
}

//////////////////////////////////////////////////////
// Register the webhook events for all cost objects
async function registerEvents( node ){
  if (node == null) {
    console.log('selected node is not correct.');
    return;
  }

  const params = node.id.split('/');
  if (params.length == 0) {
    console.log('the node id is not correct');
    return;
  }

  const activeTabText = $("ul#costTableTabs li.active").children()[0].hash;
  if(activeTabText == '#costEvents'){
    $('.clsInProgress').show();
    $('.clsResult').hide();
  }

  const projectId = params[params.length - 1];
  try{
    const requestUrl = '/api/aps/project/' + encodeURIComponent(projectId) + '/cost/events';
    await apiClientAsync( requestUrl, {}, "post");
  }catch(err){
    console.error(err);
    alert("Failed to register the Webhook Events for Cost Objects!")
    return null;
  }
  if(activeTabText == '#costEvents'){
    await $('#btnRefresh').click();
  }
  alert("The Webhook Events for Cost Objects are registered!")  
}


//////////////////////////////////////////////////////
// Unregister the webhook events for all cost objects
async function unregisterEvents(node) {
  if (node == null) {
    console.log('selected node is not correct.');
    return;
  }

  const params = node.id.split('/');
  if (params.length == 0) {
    console.log('the node id is not correct');
    return;
  }

  const activeTabText = $("ul#costTableTabs li.active").children()[0].hash;
  if(activeTabText == '#costEvents'){
    $('.clsInProgress').show();
    $('.clsResult').hide();
  }

  const projectId = params[params.length - 1];
  try {
    const requestUrl = '/api/aps/project/' + encodeURIComponent(projectId) + '/cost/events';
    await apiClientAsync(requestUrl, {}, "delete");
  } catch (err) {
    console.error(err);
    alert("Failed to unregister the Webhook Events for Cost Objects!")
    return null;
  }
  
  if(activeTabText == '#costEvents'){
    await $('#btnRefresh').click();
  }
  alert("The Webhook Events for Cost Objects are unregistered!")
}


function showUser() {
  jQuery.ajax({
    url: '/api/aps/user/profile',
    success: function (profile) {
      var img = '<img src="' + profile.picture + '" height="20px">';
      $('#userInfo').html(img + profile.name);
    }
  });
}