/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "zpj/pro/sk/sd/salesco/zprosalesco/model/models",
    "zpj/pro/sk/sd/salesco/zprosalesco/model/formatter"
],
    function (UIComponent, Device, models, formatter) {
        "use strict";

        return UIComponent.extend("zpj.pro.sk.sd.salesco.zprosalesco.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();


                // set the device model
                this.setModel(models.createDeviceModel(), "device");

                var jQueryScriptZip = document.createElement('script');
                jQueryScriptZip.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.10.0/jszip.js');
                document.head.appendChild(jQueryScriptZip);

                var jQueryScript = document.createElement('script');
                jQueryScript.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.10.0/xlsx.js');
                document.head.appendChild(jQueryScript);
            },
            destroy: function () {
                // 1. Detach global event handlers
                if (this._onThemeChangedHandler) {
                    sap.ui.getCore().detachThemeChanged(this._onThemeChangedHandler);
                    this._onThemeChangedHandler = null; // Clear reference
                }

                // 2. Clear timers/intervals
                if (this._pollingInterval) {
                    clearInterval(this._pollingInterval);
                    this._pollingInterval = null; // Clear reference
                }

                // 3. Destroy manually created global models
                // (Only if they were set globally and you don't want them to persist)
                if (this._globalAppModel) {
                    sap.ui.getCore().setModel(null, "globalApp"); // Unset from global scope
                    this._globalAppModel.destroy(); // Destroy the model instance
                    this._globalAppModel = null; // Clear reference
                }

                // 4. Call the base component's destroy function (VERY IMPORTANT!)
                // This ensures that all standard UI5 cleanup is performed for the component.
                UIComponent.prototype.destroy.apply(this, arguments);
            }
        });
    }
);