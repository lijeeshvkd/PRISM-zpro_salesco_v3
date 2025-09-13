sap.ui.define(
	[
		"sap/ui/core/mvc/Controller",
		"sap/ui/model/json/JSONModel",
		"sap/m/MessageBox",
		"zpj/pro/sk/sd/salesco/zprosalesco/utils/View2/ValueHelps",
		"zpj/pro/sk/sd/salesco/zprosalesco/utils/View2/customerCode",
		"zpj/pro/sk/sd/salesco/zprosalesco/utils/View2/validation",
		"sap/m/MessageToast",
	],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller, JSONModel, MessageBox, ValueHelps, customerCode, validation, MessageToast) {
		"use strict";

		return Controller.extend("zpj.pro.sk.sd.salesco.zprosalesco.controller.Main", {

			onInit: function () {
				this.getOwnerComponent().getRouter().attachRoutePatternMatched(this._onRouteMatched, this);
				var oEditFlag = {
					Editable: false,
				};
				var oVisibleFlag = {
					Visible: true,
				};
				var oModelEditFlag = new JSONModel(oEditFlag);
				var oModelVisibleFlag = new JSONModel(oVisibleFlag);
				this.getView().setModel(oModelEditFlag, "modelEditFlag");
				this.getView().setModel(oModelVisibleFlag, "modelVisibleFlag");
				var dataModelValueHelp = this.getOwnerComponent().getModel("valueHelp").getData();
				this.getView().setModel(new JSONModel(dataModelValueHelp), "LocalJSONModels");
				// Start: Date001
				// New
				this.getView().setModel(new JSONModel({ start: "", end: "" }), "dateRange");
				// End: Date001   

				// Global model for properties
				var oProperties = {
					mode: "None",
					rowMode: "Single",
					selBehavior: "RowOnly",
					deleteButton: false,
					requestTableVisible: true,
					zoho: {
						zohoVisible: false,
						zohoFilter: {},
						zohoFilterFieldState: {
							Projid: "None",
							Oppurtunity: "None"
						},
						zohoData: []
					}
				}
				this.getView().setModel(new JSONModel(oProperties), "mainModel");
				this.getView().setModel(new JSONModel({}), "count");
			},

			// Start: Sales Office
			onSalesOfficeHelp: function () {
				if (!this.SalesOfficerag) {
					this.SalesOfficerag = sap.ui.xmlfragment("zpj.pro.sk.sd.salesco.zprosalesco.view.fragments.main.salesOfficeF4", this);
					this.getView().addDependent(this.SalesOfficerag);
					this._SalesOfficeTemp = sap.ui.getCore().byId("idSLSalesOfficeValueHelp").clone();
					this._oTemp = sap.ui.getCore().byId("idSLSalesOfficeValueHelp").clone();
				}
				var aFilter = [];

				var oFilterDomname = new sap.ui.model.Filter([new sap.ui.model.Filter("Domname", sap.ui.model.FilterOperator.EQ, "TVKBZ")], false);
				var oFilterDomname1 = new sap.ui.model.Filter([new sap.ui.model.Filter("Domname1", sap.ui.model.FilterOperator.EQ, "")], false);
				var oFilterDomname2 = new sap.ui.model.Filter([new sap.ui.model.Filter("Domname2", sap.ui.model.FilterOperator.EQ, "")], false);
				aFilter.push(oFilterDomname);
				aFilter.push(oFilterDomname1);
				aFilter.push(oFilterDomname2);

				sap.ui.getCore().byId("idSDSalesOfficeF4").bindAggregation("items", {
					path: "/ET_VALUE_HELPSSet",
					filters: aFilter,
					template: this._SalesOfficeTemp,
				});
				this.SalesOfficerag.open();
			},

			//Start: Customer Code
			// On Value Help(F4)
			onCustomerCodeHelp: function () {
				customerCode.onCustomerCodeHelp(this);
			},

			// On F4 search
			onValueHelpSearch_custCode: function (oEvent) {
				customerCode.onValueHelpSearch_custCode(oEvent, this);
			},

			// On F4 confirm
			onValueHelpConfirm_custCode: function (oEvent) {
				var dataModelPayload = this.getOwnerComponent().getModel("payload").getData();
				dataModelPayload.header.ET_SALES_COORD_ISET.results = [];
				dataModelPayload.header.ET_SALES_COORD_ISET.results.push(dataModelPayload.item);
				this.getView().setModel(new JSONModel(dataModelPayload.header), "JSONModelPayload");
				customerCode.onValueHelpConfirm_custCode(oEvent, this);
			},

			// on Submit
			onCustomerCodeInputSubmit: function (oEvent) {
				customerCode.onCustomerCodeInputSubmit(oEvent, this);
			},

			// On Suggest
			onSuggest_custCode: function (oEvent) {
				customerCode.onSuggest_custCode(oEvent, this);
			},

			// On change
			onCustomerCodeInputChange: function () {
				customerCode.onCustomerCodeInputChange(this);
			},

			// on Suggestion select
			onCustomerCodeInputSuggestionSelect: function (oEvent) {
				customerCode.onCustomerCodeInputSuggestionSelect(oEvent, this);
			},

			// On live change
			onCustomerCodeLiveChange: function (oEvent) {
				customerCode.onCustomerCodeLiveChange(oEvent);
			},

			//End: Customer Code

			onVerticalSelectChange: function (oEvent) {
				var sLastSelectedVertical = oEvent.getSource().getSelectedKey();
				oEvent.getSource().setValueState("None");
				if (this.sPreviousVertical) {
					MessageBox.confirm("Products will be refreshed if Vertical changed, Do you wish to continue ", {
						actions: ["Yes", "No"],
						onClose: function (oAction) {
							if (oAction === "Yes") {
								this.sPreviousVertical = sLastSelectedVertical;
								this.clearProducts();
								this.clearSummary();
							} else {
								if (this.sPreviousVertical) {
									this.getView().getModel("JSONModelPayload").setProperty("/Spart", this.sPreviousVertical);
									// oEvent.getSource().setSelectedKey(this.sPreviousVertical);
								}
							}
						}.bind(this),
					});
				} else {
					this.sPreviousVertical = oEvent.getSource().getSelectedKey();
				}
			},

			onValueHelpSearch: function (evt) {
				var aFilter = [];
				var sValue = evt.getParameter("value");
				var sPath = "/ET_VALUE_HELPSSet";
				var oSelectDialog = sap.ui.getCore().byId(evt.getParameter("id"));
				var oFilterDomname = new sap.ui.model.Filter([new sap.ui.model.Filter("Domname", sap.ui.model.FilterOperator.EQ, "TVKBZ")], false);
				var oFilterDomname1 = new sap.ui.model.Filter([new sap.ui.model.Filter("Domname1", sap.ui.model.FilterOperator.EQ, sValue)], false);

				aFilter.push(oFilterDomname);
				aFilter.push(oFilterDomname1);
				oSelectDialog.bindAggregation("items", {
					path: sPath,
					filters: aFilter,
					template: this._oTemp,
				});
			},

			onValueHelpConfirm: function (evt) {

				var oSelectedItem = evt.getParameter("selectedItem");
				var sSelectedValue = oSelectedItem.getProperty("title");
				this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.SalesOffice.Input")).setValue(sSelectedValue);
				// this.getView().byId("id.SalesOffice.Input").setValue(sSelectedValue);
			},

			// Submit action - Sales Office
			onSalesOfficeInputSubmit: function (oEvent) {
				var sTerm = oEvent.getParameter("value"),
					aFilters = [],
					oFilterDomname = new sap.ui.model.Filter([new sap.ui.model.Filter("Domname", sap.ui.model.FilterOperator.EQ, "TVKBZ")], false),
					oFilterDomname1 = new sap.ui.model.Filter([new sap.ui.model.Filter("Domname1", sap.ui.model.FilterOperator.EQ, sTerm)], false),
					sValue1 = "/Vkbur",
					sValue2 = "",
					sMessage = "Entered Sales Office is wrong";
				aFilters.push(oFilterDomname);
				aFilters.push(oFilterDomname1);
				// aFilters.push(oFilterDomname2);
				// this._submitCall(sTerm, aFilters, sValue1, sValue2, sMessage);
			},

			onSuggest: function (oEvent) {
				var sTerm = oEvent.getParameter("suggestValue"),
					aFilters = [],
					sPath = "/ET_VALUE_HELPSSet",
					oFilterDomname,
					oFilterDomname1,
					oFilterDomname2;
				if (sTerm.includes(",")) {
					var nItems = sTerm.split(",").length;
					sTerm = sTerm.split(",")[sTerm.split(",").length - 1];
				}
				oFilterDomname = new sap.ui.model.Filter([new sap.ui.model.Filter("Domname", sap.ui.model.FilterOperator.EQ, "TVKBZ")], false);
				oFilterDomname1 = new sap.ui.model.Filter([new sap.ui.model.Filter("Domname1", sap.ui.model.FilterOperator.EQ, sTerm)], false);
				oFilterDomname2 = new sap.ui.model.Filter([new sap.ui.model.Filter("Domname2", sap.ui.model.FilterOperator.EQ, "")], false);
				aFilters.push(oFilterDomname);
				aFilters.push(oFilterDomname2);
				aFilters.push(oFilterDomname1);

				if (sTerm) {
					this.getView().setBusy(true);
					this.getView()
						.getModel()
						.read(sPath, {
							filters: aFilters,
							success: function (Data) {

								if (Data.results.length > 0) {
									var JSONModelForSuggest = new JSONModel(Data.results);
									this.getView().setModel(JSONModelForSuggest, "JSONModelForSuggest");
									this.getView().getModel("JSONModelForSuggest").refresh(true);
								}
								this.getView().setBusy(false);
							}.bind(this),
							error: function (oError) {
								this.getView().setBusy(false);
								MessageBox.error(JSON.parse(oError.responseText).error.innererror.errordetails[0].message, {
									actions: [sap.m.MessageBox.Action.OK],
									onClose: function (oAction) { },
								});
							}.bind(this),
						});
				}
			},

			onZohoFiterSearch: function () {
				var aFilter = [],
					oDataModel = this.getView().getModel(),
					oMainModel = this.getView().getModel("mainModel"),
					isFilledMandatory = true;
				if (oMainModel.getProperty("/zoho/zohoFilter/Projid")) {
					// aFilter.push(new sap.ui.model.Filter([new sap.ui.model.Filter("Projid", sap.ui.model.FilterOperator.EQ, oMainModel.getProperty("/zoho/zohoFilter/Projid"))], false));
				} else {
					isFilledMandatory = false;
					oMainModel.setProperty("/zoho/zohoFilterFieldState/Projid", "Error");
				}

				if (oMainModel.getProperty("/zoho/zohoFilter/Oppurtunity")) {
					// aFilter.push(new sap.ui.model.Filter([new sap.ui.model.Filter("Oppu", sap.ui.model.FilterOperator.EQ, oMainModel.getProperty("/zoho/zohoFilter/Oppurtunity"))], false));
				} else {
					isFilledMandatory = false;
					oMainModel.setProperty("/zoho/zohoFilterFieldState/Oppurtunity", "Error");
				}

				if (oMainModel.getProperty("/zoho/zohoFilter/Customer")) {
					aFilter.push(new sap.ui.model.Filter([new sap.ui.model.Filter("Kunnr", sap.ui.model.FilterOperator.EQ, oMainModel.getProperty("/zoho/zohoFilter/Customer"))], false));
				}

				if (oMainModel.getProperty("/zoho/zohoFilter/SalesOffice")) {
					aFilter.push(new sap.ui.model.Filter([new sap.ui.model.Filter("Vkbur", sap.ui.model.FilterOperator.EQ, oMainModel.getProperty("/zoho/zohoFilter/SalesOffice"))], false));
				}

				var sPath = "/ET_ZDI_TP_OPPSet";
				if (isFilledMandatory) {
					this.getView().setBusy(true);
					oDataModel.read(sPath, {
						filters: aFilter,
						success: function (Data) {
							this.getView().setBusy(false);
							oMainModel.setProperty("/zoho/zohoData", Data.results);
						}.bind(this),
						error: function (oError) {
							this.getView().setBusy(false);
							MessageBox.error(JSON.parse(oError.responseText).error.innererror.errordetails[0].message, {
								actions: [sap.m.MessageBox.Action.OK],
								onClose: function (oAction) { },
							});
						}.bind(this)
					});
				}
			},

			onZohoFilterFieldChange: function(oEvent) {
				var oMainModel = this.getView().getModel("mainModel"),
					oControl = oEvent.getSource();

				if ((oControl.getId().includes("zohoProjectIDInput") || oControl.getId().includes("zohoOppurtunityFilterInput")) && oControl.getValue()) {
					oControl.setValueState("None");
				}
			},

			// End: Sales Office
			onSearch: function () {
				// Come back here
				this.getView().getModel("modelVisibleFlag").setProperty("/Visible", true);
				this.getView().getModel("modelVisibleFlag").refresh(true);
				this.getView().getModel("modelEditFlag").setProperty("/Editable", false);
				this.getView().getModel("modelEditFlag").refresh(true);
				this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.main.TblBtnDelet")).setVisible(false);
				//Start tableSort001
				this.getView().getModel("mainModel").setProperty("/deleteButton", false);
				//End tableSort001
				var vSalesOffice = this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.SalesOffice.Input")).getValue(),
					vPAFNo = this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.PafNo.Input")).getValue(),
					vMessage = "Enter 'Sales Office' to proceed",
					vCustomerCode = this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "idV1InpCustCode")).getValue(),
					vVertical = this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "idV1SLVertical")).getSelectedKey();
				// Start: Date001
				//  Old
				// this.sDate = this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.Date.DatePicker")).getValue();
				// End: Date001

				if (!vSalesOffice) {
					this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.SalesOffice.Input")).setValueState("Error");
					this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.SalesOffice.Input")).setValueStateText("Enter Sales Office");
					this.getView().setModel(new JSONModel({}), "ModelForTable");
					this.getView().getModel("ModelForTable").refresh(true);
					this.getView().getModel("count").refresh(true);
					MessageBox.error(vMessage);
				} else {
					this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.SalesOffice.Input")).setValueState("None");

					if (this.sID === "null" || this.sID === undefined) {
						this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.main.IconTabBar")).setSelectedKey("All");
						var dataCount = this.getOwnerComponent().getModel("payload").getData().count;
						this.getView().setModel(new JSONModel(dataCount), "count");
						vSalesOffice = vSalesOffice.replace(/\s/g, "");
						var oFilterSalOffice = new sap.ui.model.Filter([new sap.ui.model.Filter("Vkbur", sap.ui.model.FilterOperator.EQ, vSalesOffice)], false);
						var oFilterPafNo = new sap.ui.model.Filter([new sap.ui.model.Filter("Pafno", sap.ui.model.FilterOperator.EQ, vPAFNo)], false);
						var oFilterCustCode = new sap.ui.model.Filter([new sap.ui.model.Filter("Kunnr", sap.ui.model.FilterOperator.EQ, vCustomerCode)], false);
						var oFilterVertical = new sap.ui.model.Filter([new sap.ui.model.Filter("Spart", sap.ui.model.FilterOperator.EQ, vVertical)], false);
						this._getRequestData("", "count", oFilterSalOffice, oFilterPafNo, oFilterCustCode, oFilterVertical);
						this._getRequestData("P", "count", oFilterSalOffice, oFilterPafNo, oFilterCustCode, oFilterVertical);
						this._getRequestData("A", "count", oFilterSalOffice, oFilterPafNo, oFilterCustCode, oFilterVertical);
						this._getRequestData("R", "count", oFilterSalOffice, oFilterPafNo, oFilterCustCode, oFilterVertical);
						// this._getRequestData("D", "count");
						this._getRequestData("", "tableData", oFilterSalOffice, oFilterPafNo, oFilterCustCode, oFilterVertical);
					}
				}
			},

			_submitCall: function (sTerm, aFilters, sValue1, sValue2, sMessage) {
				if (sTerm) {
					var sPath = "/ET_VALUE_HELPSSet";
					this.getView().setBusy(true);
					this.getView()
						.getModel()
						.read(sPath, {
							filters: aFilters,
							// urlParameters: {
							//     "$expand": ""
							// },
							success: function (Data) {
								if (Data.results.length === 1) {
									this.getView().byId("id.SalesOffice.Input").setValue(Data.results[0].DomvalueL);
								} else {
									this.getView().byId("id.SalesOffice.Input").setValue("");
									MessageBox.error(sMessage);
								}
								this.getView().setBusy(false);
							}.bind(this),
							error: function (oError) {
								this.getView().setBusy(false);
								MessageBox.error(JSON.parse(oError.responseText).error.innererror.errordetails[0].message, {
									actions: [sap.m.MessageBox.Action.OK],
									onClose: function (oAction) { },
								});
							}.bind(this),
						});
				}
			},

			_onRouteMatched: function (oEvent) {
				var oGlobalModel = this.getView().getModel("globalModel");
				oGlobalModel.setProperty("/selectedZoho", {});
				this.sID = oEvent.getParameter("arguments").ID;
				// var oEditFlag = {
				//     "Editable": false
				// }
				// var oModelEditFlag = new JSONModel(oEditFlag);
				// this.getView().setModel(oModelEditFlag, "modelEditFlag");
				// if (this.sID === "null" || this.sID === undefined) {
				//     this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.main.IconTabBar")).setSelectedKey("All");
				//     var dataCount = this.getOwnerComponent().getModel("payload").getData().count;
				//     this.getView().setModel(new JSONModel(dataCount), "count");

				//     this._getRequestData("", "count");
				//     this._getRequestData("P", "count");
				//     this._getRequestData("A", "count");
				//     this._getRequestData("R", "count");
				//     // this._getRequestData("D", "count");
				//     this._getRequestData("", "tableData");

				// }
			},

			_getRequestData: function (sStatusText, sForWhat, oFilterSalOffice, oFilterPafNo, oFilterCustCode, oFilterVertical) {
				var aFilter = [];
				var oFilter = new sap.ui.model.Filter([new sap.ui.model.Filter("Status", sap.ui.model.FilterOperator.EQ, sStatusText)], false);
				aFilter.push(oFilter);
				aFilter.push(oFilterSalOffice);
				aFilter.push(oFilterPafNo);
				aFilter.push(oFilterCustCode);
				aFilter.push(oFilterVertical);
				var sPath = "/ET_ZDI_TP_BILLSet";
				var that = this;
				this.getView().setBusy(true);
				this.getView()
					.getModel()
					.read(sPath, {
						filters: aFilter,
						success: function (Data) {

							// Start: Date001
							// old
							// if (that.sDate) {

							//   var aItems = [];
							//   var nTemp = 0;

							//   var sDateFromFE =
							//     new Date(that.sDate).getDate().toString() +
							//     new Date(that.sDate).getMonth().toString() +
							//     new Date(that.sDate).getFullYear().toString();
							//   for (let index = 0; index < Data.results.length; index++) {
							//     var sDateFromBE =
							//       new Date(Data.results[index].Erdat).getDate().toString() +
							//       new Date(Data.results[index].Erdat).getMonth().toString() +
							//       new Date(Data.results[index].Erdat).getFullYear().toString();
							//     if (sDateFromBE === sDateFromFE) {
							//       aItems.push(Data.results[index]);
							//       nTemp = 1;
							//     }
							//   }

							//   if (nTemp === 1) {
							//     Data.results = aItems;
							//   } else {
							//     Data.results = [];
							//   }
							// }
							// New
							var startDate = that.getView().getModel("dateRange").getProperty("/start"),
								endDate = that.getView().getModel("dateRange").getProperty("/end");

							if (startDate && endDate) {
								var aItems = [];
								var nTemp = 0;
								for (let index = 0; index < Data.results.length; index++) {
									if (Data.results[index].Erdat >= startDate && Data.results[index].Erdat <= endDate) {
										aItems.push(Data.results[index]);
										nTemp = 1;
									}
								}

								if (nTemp === 1) {
									Data.results = aItems;
								} else {
									Data.results = [];
								}
							}
							// End: Date001

							// else {
							//     if (that.sDate) {
							//         MessageToast.show("Please check the date");
							//     }
							// }

							that.getView().setBusy(false);
							if (sForWhat === "count") {
								if (sStatusText === "P") {
									that.aDelayedData = [];
									that.aPendingData = [];
									for (var i = 0; i < Data.results.length; i++) {
										var obj = Data.results[i];
										for (var key in obj) {
											if (obj["Erdat"]) {
												if (key === "Status") {
													if (obj["Status"] === "P") {
														var today = new Date();
														if (Math.floor((today - obj["Erdat"]) / (1000 * 3600 * 24)) > 1) {
															obj["Status"] = "D";
															that.aDelayedData.push(obj);
														} else {
															that.aPendingData.push(obj);
														}
													}
												}
											}
										}
									}
								}

								switch (sStatusText) {
									case "P":
										that.getView().getModel("modelEditFlag").setProperty("/Editable", true);
										that.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.main.TblBtnDelet")).setVisible(true);
										//Start tableSort001
										that.getView().getModel("mainModel").setProperty("/deleteButton", false);
										//End tableSort001
										that.getView().getModel("count").getData().onGoing = that.aPendingData.length;
										that.getView().getModel("count").getData().Delayed = that.aDelayedData.length;
										break;
									case "A":
										that.getView().getModel("modelEditFlag").setProperty("/Editable", false);
										that.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.main.TblBtnDelet")).setVisible(false);
										//Start tableSort001
										that.getView().getModel("mainModel").setProperty("/deleteButton", false);
										//End tableSort001
										that.getView().getModel("count").getData().Approved = Data.results.length;
										break;
									case "R":
										that.getView().getModel("modelEditFlag").setProperty("/Editable", false);
										that.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.main.TblBtnDelet")).setVisible(false);
										//Start tableSort001
										that.getView().getModel("mainModel").setProperty("/deleteButton", false);
										//End tableSort001
										that.getView().getModel("count").getData().Rejected = Data.results.length;
										break;
									case "D":
										that.getView().getModel("modelEditFlag").setProperty("/Editable", true);
										that.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.main.TblBtnDelet")).setVisible(true);
										//Start tableSort001
										that.getView().getModel("mainModel").setProperty("/deleteButton", false);
										//End tableSort001
										that.getView().getModel("count").getData().Delayed = that.aDelayedData.length;
										break;
									case "":
										that.getView().getModel("modelEditFlag").setProperty("/Editable", false);
										that.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.main.TblBtnDelet")).setVisible(false);
										//Start tableSort001
										that.getView().getModel("mainModel").setProperty("/deleteButton", false);
										//End tableSort001
										that.getView().getModel("count").getData().Total = Data.results.length;
										break;
									default:
										break;
								}
							} else {
								var dataTableModel;
								if (sForWhat === "tableData" && sStatusText === "P") {
									dataTableModel = that.aPendingData;
								} else if (sForWhat === "tableData" && sStatusText === "D") {
									dataTableModel = that.aDelayedData;
								} else {
									dataTableModel = Data.results;
								}

								that.getView().setModel(new JSONModel(dataTableModel), "ModelForTable");
							}
							that.getView().getModel("count").refresh(true);
						},
						error: function (oError) {
							that.getView().setBusy(false);
							MessageBox.error(JSON.parse(oError.responseText).error.innererror.errordetails[0].message, {
								actions: [sap.m.MessageBox.Action.OK],
								onClose: function (oAction) {

								},
							});
						},
					});
			},

			onOrderNumber: function (oEvent) {
				var vValue = oEvent.getParameter("value");
				var filter = new sap.ui.model.Filter({
					path: "Pafno",
					operator: sap.ui.model.FilterOperator.Contains,
					value1: vValue,
				});
				//Start tableSort001
				// Old
				var oTable = this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.main.Products.Table"));
				oTable.getBinding("items").filter(filter);
				oTable.setShowOverlay(false);
				// New
				var oTable = this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "table"));
				oTable.getBinding("rows").filter(filter);
				oTable.setShowOverlay(false);
				//End tableSort001
			},

			onNewPress: function () {
				this.oRouter = this.getOwnerComponent().getRouter();
				this.oRouter.navTo("page2", {
					ID: "null",
				});
			},

			onAdaptPress: function () {

				var oZohoTable = this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "zohoTable")),
					oSeletedItem = oZohoTable.getRows()[0].getBindingContext("mainModel").getObject(),
					oGlobalModel = this.getView().getModel("globalModel");

				oGlobalModel.setProperty("/selectedZoho", oSeletedItem);
				this.oRouter = this.getOwnerComponent().getRouter();
				this.oRouter.navTo("page2", {
					ID: "null",
				});
			},

			zohoTableSelectionChange: function() {
				var oGlobalModel = this.getView().getModel("globalModel");
				oGlobalModel.setProperty("/selectedZoho", {});
			},

			onBack: function () {
				this.getOwnerComponent().getRouter().navTo("RouteView1", {});
			},

			onClickofItem: function (oEvent) {
				//Start tableSort001
				// old
				// var pafNo = oEvent.getSource().getCells()[0].getText();
				// New
				var pafNo = oEvent.getParameter("rowContext").getObject().Pafno;
				this.oRouter = this.getOwnerComponent().getRouter();
				this.oRouter.navTo("page2", {
					ID: pafNo,
				});
				//End tableSort001
			},

			onFilterSelect: function (oEvent) {
				this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.orderNumber.Input")).setValue("");
				var sKey = oEvent.getParameter("key");
				var vPAFNo = this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.PafNo.Input")).getValue();
				var vSalesOffice = this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.SalesOffice.Input")).getValue();
				var vCustomerCode = this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "idV1InpCustCode")).getValue();
				var vVertical = this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "idV1SLVertical")).getSelectedKey();
				var oFilterSalOffice = new sap.ui.model.Filter([new sap.ui.model.Filter("Vkbur", sap.ui.model.FilterOperator.EQ, vSalesOffice)], false);
				var oFilterPafNo = new sap.ui.model.Filter([new sap.ui.model.Filter("Pafno", sap.ui.model.FilterOperator.EQ, vPAFNo)], false);
				var oFilterCustCode = new sap.ui.model.Filter([new sap.ui.model.Filter("Kunnr", sap.ui.model.FilterOperator.EQ, vCustomerCode)], false);
				var oFilterVertical = new sap.ui.model.Filter([new sap.ui.model.Filter("Spart", sap.ui.model.FilterOperator.EQ, vVertical)], false);
				this.getView().getModel("mainModel").setProperty("/zoho/zohoVisible", false);
				this.getView().getModel("mainModel").setProperty("/requestTableVisible", true);
				if (sKey === "All") {
					this._getRequestData("", "tableData", oFilterSalOffice, oFilterPafNo, oFilterCustCode, oFilterVertical);
					this.getView().getModel("modelEditFlag").setProperty("/Editable", false);
					this.getView().getModel("modelVisibleFlag").setProperty("/Visible", true);
					this.getView().getModel("mainModel").setProperty("/mode", "None");
					//Start tableSort001
					// this.getView().getModel("mainModel").setProperty("/rowMode", "Single");
					this.getView().getModel("mainModel").setProperty("/deleteButton", false);
					//End tableSort001
					this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.main.TblBtnDelet")).setVisible(false);
				} else if (sKey === 'Zoho') {
					this.getView().getModel("modelEditFlag").setProperty("/Editable", true);
					this.getView().getModel("modelVisibleFlag").setProperty("/Visible", false);
					this.getView().getModel("mainModel").setProperty("/zoho/zohoVisible", true);
					this.getView().getModel("mainModel").setProperty("/requestTableVisible", false);
				} else if (sKey === "Delay") {
					this._getRequestData("D", "tableData", oFilterSalOffice, oFilterPafNo, oFilterCustCode, oFilterVertical);
					this.getView().getModel("modelEditFlag").setProperty("/Editable", true);
					this.getView().getModel("modelVisibleFlag").setProperty("/Visible", false);
					this.getView().getModel("mainModel").setProperty("/mode", "SingleSelectLeft");
					//Start tableSort001
					// this.getView().getModel("mainModel").setProperty("/rowMode", "Single");
					// this.getView().getModel("mainModel").setProperty("/selBehavior", "RowSelector");
					this.getView().getModel("mainModel").setProperty("/deleteButton", false);
					//End tableSort001
					this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.main.TblBtnDelet")).setVisible(true);
				} else if (sKey === "OnGoing") {
					this._getRequestData("P", "tableData", oFilterSalOffice, oFilterPafNo, oFilterCustCode, oFilterVertical);
					this.getView().getModel("modelEditFlag").setProperty("/Editable", true);
					this.getView().getModel("modelVisibleFlag").setProperty("/Visible", false);
					this.getView().getModel("mainModel").setProperty("/mode", "SingleSelectLeft");
					//Start tableSort001
					// this.getView().getModel("mainModel").setProperty("/rowMode", "MultiToggle");
					this.getView().getModel("mainModel").setProperty("/deleteButton", false);
					//End tableSort001
					this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.main.TblBtnDelet")).setVisible(true);
				} else if (sKey === "Approved") {
					this._getRequestData("A", "tableData", oFilterSalOffice, oFilterPafNo, oFilterCustCode, oFilterVertical);
					this.getView().getModel("modelEditFlag").setProperty("/Editable", false);
					this.getView().getModel("modelVisibleFlag").setProperty("/Visible", false);
					this.getView().getModel("mainModel").setProperty("/mode", "None");
					//Start tableSort001
					// this.getView().getModel("mainModel").setProperty("/rowMode", "None");
					this.getView().getModel("mainModel").setProperty("/deleteButton", false);
					//End tableSort001
					this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.main.TblBtnDelet")).setVisible(false);
				} else if (sKey === "Rejected") {
					this._getRequestData("R", "tableData", oFilterSalOffice, oFilterPafNo, oFilterCustCode, oFilterVertical);
					this.getView().getModel("modelEditFlag").setProperty("/Editable", false);
					this.getView().getModel("modelVisibleFlag").setProperty("/Visible", false);
					this.getView().getModel("mainModel").setProperty("/mode", "None");
					//Start tableSort001
					// this.getView().getModel("mainModel").setProperty("/rowMode", "None");
					this.getView().getModel("mainModel").setProperty("/deleteButton", false);
					//End tableSort001
					this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.main.TblBtnDelet")).setVisible(false);
				}
			},

			_onDelete: function (oEvent) {
				var oTable = this.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.main.Products.Table"));
				var oSelectedItem = oTable.getSelectedItems();

				if (oSelectedItem.length > 0) {
					var sContextPath = oTable.getSelectedItem().oBindingContexts.ModelForTable.sPath;

					var oOrderNumber = this.getView().getModel("ModelForTable").getContext(sContextPath).getProperty("Pafno");
					var sPath = "/ET_Sales_coord_HSet('" + oOrderNumber + "')";
					var that = this;
					MessageBox.confirm("Are you sure you want to delete Order No:'" + oOrderNumber + "' ?", {
						actions: ["Yes", "No"],
						onClose: function (oAction) {
							if (oAction === "Yes") {
								that.getView().setBusy(true);
								that
									.getView()
									.getModel()
									.read(sPath, {
										success: function (Data) {
											that.getView().setBusy(false);
											MessageBox.success("Order No:'" + oOrderNumber + "' Deleted", {
												actions: ["Ok"],
												onClose: function (oAction) {
													window.location.reload();
													// that.byId(sap.ui.core.Fragment.createId("id.tableProductDetails.Fragment", "id.main.IconTabBar")).setSelectedKey("All");
												},
											});
										},
										error: function (oError) {
											that.getView().setBusy(false);
											MessageBox.error(JSON.parse(oError.responseText).error.innererror.errordetails[0].message, {
												actions: [sap.m.MessageBox.Action.OK],
												onClose: function (oAction) { },
											});
										},
									});
							} else {
							}
						},
					});
				} else {
					MessageBox.error("Please Select a Row to Delete");
				}
			},
		});
	}
);
