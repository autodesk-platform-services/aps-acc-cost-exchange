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

module.exports = {
    // Set environment variables or hard-code here
    credentials: {
        client_id: process.env.APS_CLIENT_ID,
        client_secret: process.env.APS_CLIENT_SECRET,
        callback_url: process.env.APS_CALLBACK_URL,
        callback_cost_events: process.env.APS_CALLBACK_COST_EVENTS

    },
    scopes: {
        // Required scopes for the server-side application
        internal: ['bucket:create', 'bucket:read', 'data:read', 'data:create', 'data:write'],

        // Required scopes for the server-side BIM360 Account Admin
        internal_2legged: ['data:read', 'bucket:read', 'bucket:create', 'data:write', 'bucket:delete', 'account:read', 'account:write'],

        // Required scope for the client-side viewer
        public: ['viewables:read']
    },
    accountv1:{
        URL:{
            COMPANY_URL:    "https://developer.api.autodesk.com/hq/v1/accounts/{0}/projects/{1}/companies",
            USER_URL:       "https://developer.api.autodesk.com/hq/v1/accounts/{0}/users/{1}",
        }
      },
    
    bim360Cost:{
        URL:{
            BUDGETS_URL:        "https://developer.api.autodesk.com/cost/v1/containers/{0}/budgets?include=attributes",
            BUDGET_URL:         "https://developer.api.autodesk.com/cost/v1/containers/{0}/budgets/{1}",

            CONTRACTS_URL:      "https://developer.api.autodesk.com/cost/v1/containers/{0}/contracts?include=attributes",
            CONTRACT_URL:       "https://developer.api.autodesk.com/cost/v1/containers/{0}/contracts/{1}",
            
            COSTITEMS_URL:      "https://developer.api.autodesk.com/cost/v1/containers/{0}/cost-items?include=attributes",
            COSTITEM_URL:       "https://developer.api.autodesk.com/cost/v1/containers/{0}/cost-items/{1}",
            
            CHANGEORDERS_URL:   "https://developer.api.autodesk.com/cost/v1/containers/{0}/change-orders/{1}?include=attributes",
            CHANGEORDER_URL:    "https://developer.api.autodesk.com/cost/v1/containers/{0}/change-orders/{1}/{2}",
        
            CUSTOM_ATTRIBUTE_URL: "https://developer.api.autodesk.com/cost/v1/containers/{0}/property-values:batch-update",

            COST_EVENTS_HOOKS:    "https://developer.api.autodesk.com/webhooks/v1/systems/{0}/events/{1}/hooks",
            COST_EVENTS_HOOK:     "https://developer.api.autodesk.com/webhooks/v1/systems/{0}/events/{1}/hooks/{2}",
            COST_HOOKS:           "https://developer.api.autodesk.com/webhooks/v1/systems/{0}/hooks"

        }
    },
    
};
