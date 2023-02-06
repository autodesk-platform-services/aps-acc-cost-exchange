# ACC Cost Exchange Sample

[![Node.js](https://img.shields.io/badge/Node.js-14.0-blue.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-6.0-blue.svg)](https://www.npmjs.com/)
![Platforms](https://img.shields.io/badge/Web-Windows%20%7C%20MacOS%20%7C%20Linux-lightgray.svg)
[![Data-Management](https://img.shields.io/badge/Data%20Management-v1-green.svg)](http://developer.autodesk.com/)

[![ACC](https://img.shields.io/badge/ACC-v1-green.svg)](http://developer.autodesk.com/)
[![BIM-360](https://img.shields.io/badge/BIM%20360-v1-green.svg)](http://developer.autodesk.com/)
[![Cost Management](https://img.shields.io/badge/Cost%20Management-v1%20-green.svg)](http://developer.autodesk.com/)
[![Cost Webhooks](https://img.shields.io/badge/Cost%20Webhooks-v1-green.svg)](http://developer.autodesk.com/)

[![MIT](https://img.shields.io/badge/License-MIT-blue.svg)](http://opensource.org/licenses/MIT)
[![Level](https://img.shields.io/badge/Level-Intermediate-blue.svg)](http://developer.autodesk.com/)


## Description
This sample demonstrates exchanging properties of Budget, Contract, Cost item and Change Order between cost module and .CSV file using Cost Management API. It includes 3 main tasks:
1. Display Cost properties either in **Raw data** and **Human readable form**.
2. Export Cost properties either in **Raw data** and **Human readable form** to a CSV file.
3. Import Cost properties from a locally stored CSV file(based on **Raw data**).
4. The sample supported the Cost Webhook events, you can register/unregister cost webhook events by right clicking on the project node, if the cost webhook events are registered, the tab name will be appended with * (**BUDGET*** for example) whenever the related cost object is created/updated/deleted.


## Thumbnail
![thumbnail](/thumbnail_1.png)  
![thumbnail](/thumbnail_2.png)  

## Demonstration
[![https://youtu.be/X6mFX_yqhTI](http://img.youtube.com/vi/X6mFX_yqhTI/0.jpg)](https://youtu.be/X6mFX_yqhTI "Display and exchange cost information with CSV file")

# Web App Setup

## Prerequisites

1. **APS Account**: Learn how to create an APS Account, activate subscription and create an app at [this tutorial](http://aps.autodesk.com/tutorials). 
2. **ACC|BIM360 Account**: must be Account Admin to add the app integration. [Learn about provisioning](https://aps.autodesk.com/blog/bim-360-docs-provisioning-forge-apps). 
3. **Cost Management**: Create ACC|BIM360 project, activate Cost Management module, setup project to create **Budget Code Template** for Cost Management according to [the guide](https://help.autodesk.com/view/BIM360D/ENU/?guid=BIM360D_Cost_Management_getting_started_with_cost_management_html)
4. **Node.js**: basic knowledge with [**Node.js**](https://nodejs.org/en/).
5. **JavaScript** basic knowledge with **jQuery**

For using this sample, you need an Autodesk developer credentials. Visit the [Autodesk Developer Portal](https://developer.autodesk.com), sign up for an account, then [create an app](https://developer.autodesk.com/myapps/create). For this new app, use **http://localhost:3000/api/aps/callback/oauth** as Callback URL. Finally take note of the **Client ID** and **Client Secret**.


## Running locally

Install [NodeJS](https://nodejs.org), version 14 or newer.

Clone this project or download it (this `nodejs` branch only). It's recommended to install [GitHub desktop](https://desktop.github.com/). To clone it via command line, use the following (**Terminal** on MacOSX/Linux, **Git Shell** on Windows):

    git clone https://github.com/autodesk-platform-services/aps-acc-cost-exchange

Install the required packages using `npm install`.


**Environment variables**

Set the enviroment variables with your client ID & secret and finally start it. Via command line, navigate to the folder where this repository was cloned and use the following:

Mac OSX/Linux (Terminal)

    npm install
    export APS_CLIENT_ID=<<YOUR CLIENT ID FROM DEVELOPER PORTAL>>
    export APS_CLIENT_SECRET=<<YOUR CLIENT SECRET>>
    export APS_CALLBACK_URL=<<YOUR CALLBACK URL>>
    export APS_CALLBACK_COST_EVENTS=<<YOUR CALLBACK COST EVENTS URL>>

    npm start

Windows (use **Node.js command line** from Start menu)

    npm install
    set APS_CLIENT_ID=<<YOUR CLIENT ID FROM DEVELOPER PORTAL>>
    set APS_CLIENT_SECRET=<<YOUR CLIENT SECRET>>
    set APS_CALLBACK_URL=<<YOUR CALLBACK URL>>
    set APS_CALLBACK_COST_EVENTS=<<YOUR CALLBACK COST EVENTS URL>>

    npm start

## Using the app

Open the browser: [http://localhost:3000](http://localhost:3000). 

**Please watch the [Video](https://youtu.be/X6mFX_yqhTI) for the detail setup and usage, or follow the steps:**

- **Setup the app before using the App**
1. Make sure to [Create ACC|BIM360 project, activate Cost Management module, setup project for Cost Management](https://help.autodesk.com/view/BIM360D/ENU/?guid=BIM360D_Cost_Management_getting_started_with_cost_management_html).


- **Operate with App after setup**
1. Select a project and display Cost properties either in **Raw data** and **Human readable form**.
2. Click **Export** button to export Cost properties either in **Raw data** and **Human readable form** to a CSV file.
3. Click **Import** button to update Cost properties from a locally stored CSV file(based on **Raw data**).
4. Right click on the project node, register/unregister all cost webhook events for this project.
5. If the cost webhook events are registered, you will see the tab name be appended with * (**BUDGET*** for example)  whenever the related cost object is created/updated/deleted, you can refresh to check the latest info.


## Limitation
- Cost Management module needs to be activated before using this app, due to the current limitation of Cost API, user needs to activate & setup cost project manually. Please check [Create ACC|BIM360 project, activate Cost Management module, setup project for Cost Management](https://help.autodesk.com/view/BIM360D/ENU/?guid=BIM360D_Cost_Management_getting_started_with_cost_management_html) for details.


## Known issues
1. The 'scopeOfWork' property contain rich text which may includes '**\n**' and '**,**', but the 2 characters are reserved for special usage while parsing CSV file, to avoid the issue, I use the following 2 characters as replacement for 'scopeOfWork' property.
```js
        const Enter_Replacement = '\xfe';
        const Comma_Replacement = '\xfd';
```
## Tips & Tricks
1. Not all the properties could be updated, only these marked as **Editable** are supported.
2. To import properties from CSV file, the suggested way is to export a CSV file of **raw data** first, update the editable properties within the file, then import it back to cost module.

## Troubleshooting
1. **Cannot see my ACC projects**: Make sure to provision the APS App Client ID within the ACC Account, [learn more here](https://aps.autodesk.com/blog/bim-360-docs-provisioning-forge-apps). This requires the Account Admin permission.
 
## Further Reading
**Document**:
- [Data Management API](https://developer.autodesk.com/en/docs/data/v2/overview/)
- [BIM360 API](https://developer.autodesk.com/en/docs/bim360/v1/overview/) and [App Provisioning](https://aps.autodesk.com/blog/bim-360-docs-provisioning-forge-apps)
- [Cost Management API](https://aps.autodesk.com/en/docs/bim360/v1/overview/field-guide/cost-management/)
- [Create ACC|BIM360 project, activate Cost Management module, setup project for Cost Management](https://help.autodesk.com/view/BIM360D/ENU/?guid=BIM360D_Cost_Management_getting_started_with_cost_management_html)

**Tutorials**:
- [View ACC Models](https://tutorials.autodesk.io/tutorials/hubs-browser/)

**Blogs**:
- [APS Blog](https://aps.autodesk.com/categories/bim-360-api)
- [Field of View](https://fieldofviewblog.wordpress.com/), a BIM focused blog

## License
This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT). Please see the [LICENSE](LICENSE) file for full details.

## Written by
Zhong Wu [@johnonsoftware](https://twitter.com/johnonsoftware), [Autodesk Partner Development](http://aps.autodesk.com)
