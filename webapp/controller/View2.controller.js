sap.ui.define(
	[
		"sap/ui/core/mvc/Controller",
		"sap/ui/model/json/JSONModel",
		"sap/ui/core/IconPool",
		"sap/ui/core/Icon",
		"sap/m/Link",
		"sap/m/MessageItem",
		"sap/m/MessageView",
		"sap/m/Button",
		"sap/m/Bar",
		"sap/m/Title",
		"sap/m/Popover",
		"sap/m/MessageBox",
		"zpj/pro/sk/sd/salesco/zprosalesco/utils/View2/valueHelps",
		"zpj/pro/sk/sd/salesco/zprosalesco/utils/View2/validation",
		"zpj/pro/sk/sd/salesco/zprosalesco/utils/View2/salesOffice",
		"zpj/pro/sk/sd/salesco/zprosalesco/utils/View2/customerCode",
		"zpj/pro/sk/sd/salesco/zprosalesco/utils/View2/materialFreightGroup",
		"zpj/pro/sk/sd/salesco/zprosalesco/utils/View2/designs",
		"zpj/pro/sk/sd/salesco/zprosalesco/utils/View2/supplyPlant",
		"zpj/pro/sk/sd/salesco/zprosalesco/utils/View2/manufacturingPlant",
		"zpj/pro/sk/sd/salesco/zprosalesco/utils/View2/part",
		"zpj/pro/sk/sd/salesco/zprosalesco/utils/View2/quality",
		"sap/m/PDFViewer",
		"sap/ui/core/Fragment",
		"sap/ui/core/format/DateFormat",
		"sap/m/MessageToast",
		"sap/ui/core/util/ExportTypeCSV",
		"sap/ui/export/library",
		"sap/ui/export/Spreadsheet",
		"sap/ui/unified/FileUploader"
	],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (
		Controller, JSONModel, IconPool, Icon, Link, MessageItem, MessageView, Button, Bar, Title, Popover, MessageBox, valueHelps, validation, salesOffice, customerCode,
		materialFreightGroup, Designs, supplyPlant, manufacturingPlant, part, quality, PDFViewer, Fragment, DateFormat, MessageToast, ExportTypeCSV, exportLibrary,
		Spreadsheet, FileUploader
	) {
		"use strict";
		var EdmType = exportLibrary.EdmType;
		return Controller.extend("zpj.pro.sk.sd.salesco.zprosalesco.controller.View2", {
			onInit: function () {

				this.vTemp = 1;
				this.getOwnerComponent().getRouter().getRoute("page2").attachPatternMatched(this.onRouteMatched, this);

				// local JSON models
				this._fileDetail;
				this.Pafno;
				this._allAttachment = [];
				this._attachmentPayload;
				var dataModelValueHelp = this.getOwnerComponent().getModel("valueHelp").getData();
				this.getView().setModel(new JSONModel(dataModelValueHelp), "LocalJSONModels");
				this.bindingContextPath;

				//Start: Upload, View and Download Attachment
				var dataModelForAttachments = this.getOwnerComponent().getModel("attachments").getData();
				this.getView().setModel(new JSONModel(dataModelForAttachments), "LocalJSONModelForAttachment");
				// Start: newUploader001
				// old
				// var oUploadSet = this.byId(
				//   sap.ui.core.Fragment.createId("idV2FragAttach", "idV2UploadSet")
				// );

				// // Modify "add file" button
				// oUploadSet.getDefaultFileUploader().setButtonOnly(false);
				// oUploadSet.getDefaultFileUploader().setTooltip("");
				// oUploadSet.getDefaultFileUploader().setIconOnly(true);
				// oUploadSet.getDefaultFileUploader().setIcon("sap-icon://attachment");

				// new
				// Initialize a JSON Model to hold file data for the table
				var oModel = new JSONModel([]);
				this.getView().setModel(oModel, "oDOAAAttachmentModel");


				// Keep track of files to be uploaded (File API File objects)
				this._filesToUpload = {}; // { <fileName>: <FileObject> }
				this._uploadQueue = []; // Array of file names to process upload for

				// End: newUploader001

				this.opdfViewer = new PDFViewer();
				this.getView().addDependent(this.opdfViewer);

				//End: Upload, View and Download Attachment

				// setting response payload limit to 300
				this.getOwnerComponent().getModel().setSizeLimit(1000);

				this.getView().setModel(new JSONModel({}), "JSONModelPayload");

				var oProperties = {
					PafnoRef: "",
				};
				this.getView().setModel(new JSONModel(oProperties), "viewModel");
			},

			_readOPHeaderWithItems: function (sOppu, fnReturn) {
				var sPath = `/ET_OP_HEADSet('${sOppu}')`
				this.getView().setBusy(true);
				this.getView().getModel().read(sPath, {
					urlParameters: {
						$expand: "ET_OP_ITEMSet",
					},
					success: function (Data) {
						fnReturn(Data);
						this.getView().setBusy(false);
					}.bind(this),
					error: function (oError) {
						fnReturn(null);
						this.getView().setBusy(false);
					}.bind(this)
				});
			},

			_readPAFHeaderWithItems: function (sPafno, fnReturn) {
				var sPath = `/ET_PAF_REF_HEADERSet('${sPafno}')`
				this.getView().setBusy(true);
				this.getView().getModel().read(sPath, {
					urlParameters: {
						$expand: "ET_PAF_REF_ITEMSet",
					},
					success: function (Data) {
						fnReturn(Data);
						this.getView().setBusy(false);
					}.bind(this),
					error: function (oError) {
						fnReturn(null);
						this.getView().setBusy(false);
					}.bind(this)
				});
			},

			_itemsMap: function (aItems) {
				var oItem = {},
					aResutItems = [];
				for (var i = 0; i < aItems.length; i++) {
					oItem = {
						"Mfrgr": "",
						"Szmm": "",
						"Mvgr2": "",
						"Werks": "",
						"Prodh1": "",
						"CurVolFt": "",
						"TotalVol": "",
						"Disc": null,
						"Discb": null,
						"Commbox": null,
						"Exfacsqft": null,
						"Exdepsqft": null,
						"Commboxp": null,
						"Frgtsqft": null,
						"Compname": null,
						"Complanprice": null,
						"Sbremark": null,
						"Zzprodh4": "",
						"Mvgr5": "",
						"Isexdep": "",
						"Loekz": false
					};
					for (var key in oItem) {
						if (aItems[i].hasOwnProperty(key)) {
							oItem[key] = aItems[i][key];
						}
					}
					aResutItems.push(oItem);
				}

				return aResutItems;
			},

			onRouteMatched: function (oEvent) {
				var oArguments = oEvent.getParameter("arguments"),
					oGlobalModel = this.getView().getModel("globalModel"),
					oSeletectedZohoItem = oGlobalModel.getProperty("/selectedZoho");
				// this._readItems(oSeletectedZohoItem);
				var oViewlModelDate = {
					Editable: false,
					Required: false,
					createCopy: false,
					editButton: false,
					Pending: false
				};
				var oEditableFields = {
					Editable: false,
				};
				var oViewlModel = new JSONModel(oViewlModelDate);
				this.getView().setModel(oViewlModel, "viewModel");
				var oModelGlobalEditable = new JSONModel(oEditableFields);
				this.getView().setModel(oModelGlobalEditable, "GlobalEditableModel");

				var sID = oEvent.getParameter("arguments").ID;
				this.sID = oEvent.getParameter("arguments").ID;

				if (sID === "null" || sID === undefined) {
					this.getView().getModel("LocalJSONModelForAttachment").setData({ attachments: { Nav_File_Upload: { results: [] } } });
					this.clearSummary();
					this.getView().byId("FileUploaderId").setVisible(true);

					// this.getView().byId("id.excelExport.Link").setVisible(true);
					this.getView().getModel("viewModel").setProperty("/Editable", true);
					this.getView().getModel("GlobalEditableModel").setProperty("/Editable", true);

					// Start: pending001
					this.getView().getModel("viewModel").setProperty("/Pending", false);

					// End: pending001
					// Start: createCopy001
					this.getView().getModel("viewModel").setProperty("/createCopy", false);

					// End: createCopy001
					this.getView().byId("idV2OPSSumDetail").setVisible(true);

					this.byId(sap.ui.core.Fragment.createId("idV2FragGenInfo", "idV2SLPaymentTerm")).setEnabled(true);
					this.getView().byId("idV2OPSubAttach").setVisible(true);

					// payload for OData service
					//this.onClear();
					this.clearRequestPayload();
					var dataModelPayload = this.getView().getModel("payload").getData();

					dataModelPayload.header.ET_SALES_COORD_ISET.results = [];

					// DEFAULT VALUES FROM ZOHO SELECTION
					if (oArguments.Oppu) {
						var bIsItemAvail = false;
						this._readOPHeaderWithItems(oArguments.Oppu, function (oData) {
							if (oData) {
								dataModelPayload.header.Kunnr = oData.Kunnr || '';
								dataModelPayload.header.Name = oData.Name || '';
								dataModelPayload.header.Oppu = oData.Oppu || '';
								dataModelPayload.header.Vkbur = oData.Vkbur.trim() || '';
								dataModelPayload.header.Soname = oData.Soname || '';
								dataModelPayload.header.Validity = oData.Validity || '';
								dataModelPayload.header.Spart = oData.Spart || '';
								dataModelPayload.header.Vtweg = oData.Vtweg || '';
								dataModelPayload.header.Zterm = oData.Zterm || '';
								dataModelPayload.header.Specid = oData.Specid || '';
								dataModelPayload.header.Spec = oData.Spec || '';
								dataModelPayload.header.Proj = oData.Proj || '';

								if (oData && oData.ET_OP_ITEMSet && oData.ET_OP_ITEMSet.results.length) {
									bIsItemAvail = true;
									var aPayloadItems = this._itemsMap(oData.ET_OP_ITEMSet.results);
									dataModelPayload.header.ET_SALES_COORD_ISET.results = aPayloadItems;
								} else {
									dataModelPayload.header.ET_SALES_COORD_ISET.results.push(dataModelPayload.item);
								}
							}

							this.getView().getModel("JSONModelPayload").setData(dataModelPayload.header);
							if (bIsItemAvail) {
								validation.headerPayloadValidation(this, true);
							}
						}.bind(this));

					} else if (oArguments.Pafno) {
						this.getView().getModel("viewModel").setProperty("/PafnoRef", oArguments.Pafno);
						var bIsItemAvail = false;
						this._readPAFHeaderWithItems(oArguments.Pafno, function (oData) {
							if (oData) {
								dataModelPayload.header.Kunnr = oData.Kunnr || '';
								dataModelPayload.header.Name = oData.Name || '';
								dataModelPayload.header.Oppu = oData.Oppu || '';
								dataModelPayload.header.Vkbur = oData.Vkbur.trim() || '';
								dataModelPayload.header.Soname = oData.Soname || '';
								dataModelPayload.header.Validity = oData.Validity || '';
								dataModelPayload.header.Spart = oData.Spart || '';
								dataModelPayload.header.Vtweg = oData.Vtweg || '';
								dataModelPayload.header.Zterm = oData.Zterm || '';
								dataModelPayload.header.Specid = oData.Specid || '';
								dataModelPayload.header.Spec = oData.Spec || '';
								dataModelPayload.header.Proj = oData.Proj || '';

								if (oData && oData.ET_PAF_REF_ITEMSet && oData.ET_PAF_REF_ITEMSet.results.length) {
									bIsItemAvail = true;
									var aPayloadItems = this._itemsMap(oData.ET_PAF_REF_ITEMSet.results);
									dataModelPayload.header.ET_SALES_COORD_ISET.results = aPayloadItems;
								} else {
									dataModelPayload.header.ET_SALES_COORD_ISET.results.push(dataModelPayload.item);
								}
							}

							this.getView().getModel("JSONModelPayload").setData(dataModelPayload.header);
							if (bIsItemAvail) {
								validation.headerPayloadValidation(this, true);
							}
						}.bind(this));

					} else {
						dataModelPayload.header.ET_SALES_COORD_ISET.results.push(dataModelPayload.item);
						this.getView().getModel("JSONModelPayload").setData(dataModelPayload.header);
					}
					// END OF DEFAULT VALUES FROM ZOHO SELECTION

					//this.onClear();
					this.getView().byId("ObjectPageLayout").getHeaderTitle().setObjectTitle("Generate New Request");
					var oDOAAAttachmentModel = new JSONModel([]);
					this.getView().setModel(oDOAAAttachmentModel, "oDOAAAttachmentModel");

				} else {
					this.clearSummary();

					this.getView()
						.getModel("viewModel")
						.setProperty("/Editable", false);
					this.getView()
						.getModel("GlobalEditableModel")
						.setProperty("/Editable", false);
					// Start: pending001
					this.getView()
						.getModel("viewModel")
						.setProperty("/Pending", true);
					// End: pending001
					// Start: createCopy001
					this.getView()
						.getModel("viewModel")
						.setProperty("/createCopy", true);
					// End: createCopy001
					this.getView().byId("FileUploaderId").setVisible(false);
					// this.getView().byId("id.excelExport.Link").setVisible(false);
					this.getView().byId("idV2OPSSumDetail").setVisible(false);
					this.byId(
						sap.ui.core.Fragment.createId(
							"idV2FragGenInfo",
							"idV2SLPaymentTerm"
						)
					).setEnabled(true);
					var aFilter = [];
					var oFilter = new sap.ui.model.Filter(
						[
							new sap.ui.model.Filter(
								"Pafno",
								sap.ui.model.FilterOperator.EQ,
								sID
							),
						],
						false
					);
					aFilter.push(oFilter);
					var sPath = "/ET_SALES_COORD_HEADERSet('" + sID + "')";
					this.getView()
						.byId("ObjectPageLayout")
						.getHeaderTitle()
						.setObjectTitle(
							"Display Request Details:" + sID.replace(/^0+/, "")
						);

					var that = this;
					this.getView().setBusy(true);
					this.getView()
						.getModel()
						.read(sPath, {
							// filters: aFilter,
							urlParameters: {
								$expand: "ET_SALES_COORD_ISET",
							},
							success: function (Data) {
								if (Data.Status === "P" || Data.Status === "D") {
									that.getView().getModel("viewModel").setProperty("/editButton", true);
									// that.getView().byId("idV2BtnEdit").setVisible(true);
								} else {
									that.getView().getModel("viewModel").setProperty("/editButton", true);
									// that.getView().byId("idV2BtnEdit").setVisible(true);
								}
								Data.Validity = Data.Validity.replace(/^0+/, "");

								var aTableItems = Data.ET_SALES_COORD_ISET.results;
								var nLen = aTableItems.length;
								for (var j = 0; j < nLen; j++) {
									if (aTableItems[j].Isexdep === "") {
										aTableItems[j].Isexdep = " ";
									}
								}
								// Disc and Discb  conversion
								if (Data.Vtweg === "15" || Data.Vtweg === "19" || Data.Vtweg === "25" || Data.Vtweg === "29") {
								} else {
									for (var i = 0; i < nLen; i++) {
										aTableItems[i].Disc = aTableItems[i].Discb;
										aTableItems[i].Discb = null;
									}
								}

								that
									.getView()
									.setModel(new JSONModel(Data), "JSONModelPayload");
								if (
									that
										.getView()
										.getModel("JSONModelPayload")
										.getProperty("/Vtweg")
								) {
									that.sPreviousDistributionChannel = that
										.getView()
										.getModel("JSONModelPayload")
										.getProperty("/Vtweg");
								}
								if (
									that
										.getView()
										.getModel("JSONModelPayload")
										.getProperty("/Spart")
								) {
									that.sPreviousVertical = that
										.getView()
										.getModel("JSONModelPayload")
										.getProperty("/Spart");
								}
								that.getView().setBusy(false);
								that._displaySummaryDetails();
							},
							error: function (oError) {
								that.getView().setBusy(false);
								var sErrorMessage = JSON.parse(oError.responseText).error
									.innererror.errordetails[0].message;
								if (sErrorMessage) {
									MessageBox.error(sErrorMessage, {
										actions: [sap.m.MessageBox.Action.OK],
										onClose: function (oAction) { },
									});
								} else {
									MessageBox.error(
										"Something went wrong, Please refresh browser and try again",
										{
											actions: [sap.m.MessageBox.Action.OK],
											onClose: function (oAction) { },
										}
									);
								}
							},
						});
					var sPathUpload = "/ETFILE_UPLOAD_HSet('" + sID + "')";
					that.getView().setBusy(true);
					that
						.getView()
						.getModel("ZFILE_UPLOAD_SRV_01")
						.read(sPathUpload, {
							urlParameters: {
								$expand: "Nav_File_Upload",
							},
							async: false,
							success: function (Data) {
								that.getView().byId("idV2OPSAttach").setVisible(true);
								var attachments = Data;
								that
									.getView()
									.getModel("LocalJSONModelForAttachment")
									.setData({ attachments: attachments });

								that
									.getView()
									.getModel("oDOAAAttachmentModel")
									.setData(attachments.Nav_File_Upload.results);

								that
									.getView()
									.getModel("LocalJSONModelForAttachment")
									.refresh(true);
								that.getView().setBusy(false);
							},
							error: function (oError) {
								that.getView().setBusy(false);
								var sErrorMessage = JSON.parse(oError.responseText).error
									.innererror.errordetails[0].message;
								if (sErrorMessage) {
									MessageBox.error(sErrorMessage, {
										actions: [sap.m.MessageBox.Action.OK],
										onClose: function (oAction) { },
									});
								} else {
									MessageBox.error(
										"Something went wrong, Please refresh browser and try again",
										{
											actions: [sap.m.MessageBox.Action.OK],
											onClose: function (oAction) { },
										}
									);
								}
							},
						});
				}
			},
			// Start: createCopy001
			onCreateCopy: function () {
				this.getView().getModel("JSONModelPayload").setProperty("/Pafno", "")
				this.getView()
					.getModel("viewModel")
					.setProperty("/Editable", true);
				this.getView()
					.getModel("GlobalEditableModel")
					.setProperty("/Editable", true);
				this.getView().byId("FileUploaderId").setVisible(true);
				this.getView().byId("idV2OPSSumDetail").setVisible(true);
				this.getView().getModel("viewModel").setProperty("/editButton", false);
				this.getView().getModel("viewModel").setProperty("/createCopy", false);
				this.getView()
					.byId("ObjectPageLayout")
					.getHeaderTitle()
					.setObjectTitle("Generate New Request");
			},
			// End: createCopy001
			onEdit: function () {
				// Start: createCopy001
				this.getView()
					.getModel("viewModel")
					.setProperty("/createCopy", false);
				this.getView().getModel("viewModel").setProperty("/editButton", false);
				// End: createCopy001
				if (this.sID !== "null") {
					this.getView()
						.getModel("viewModel")
						.setProperty("/Editable", false);
					this.getView()
						.getModel("GlobalEditableModel")
						.setProperty("/Editable", true);
					this.getView().byId("FileUploaderId").setVisible(false);
					// this.getView().byId("id.excelExport.Link").setVisible(false);
					this.getView().byId("idV2OPSSumDetail").setVisible(true);
				} else {
					this.getView()
						.getModel("viewModel")
						.setProperty("/Editable", true);
					this.getView()
						.getModel("GlobalEditableModel")
						.setProperty("/Editable", true);
					this.getView().byId("FileUploaderId").setVisible(true);
					this.getView().byId("idV2OPSSumDetail").setVisible(true);
				}
			},
			//Start: Distribution and Vertical Selection change
			onDistributionChannelChange: function (oEvent) {
				var sLastSelectedDistributionChannel = oEvent
					.getSource()
					.getSelectedKey();
				oEvent.getSource().setValueState("None");
				this.getView().getModel("JSONModelPayload").setProperty("/Zterm", "");
				var vGetSelectedValue = oEvent.getSource().getSelectedKey();
				// Start: Mandatefields001
				if (vGetSelectedValue === "15" || vGetSelectedValue === "17" || vGetSelectedValue === "25" || vGetSelectedValue === "27" || vGetSelectedValue === "29") {
					this.getView()
						.getModel("viewModel")
						.setProperty("/Required", true);
				} else {
					this.getView()
						.getModel("viewModel")
						.setProperty("/Required", false);
				}
				// End: Mandatefields001
				if (vGetSelectedValue === "27" || vGetSelectedValue === "17") {
					this.byId(
						sap.ui.core.Fragment.createId(
							"idV2FragGenInfo",
							"idV2SLPaymentTerm"
						)
					).setEnabled(true);
					this.byId(
						sap.ui.core.Fragment.createId("idV2FragGenInfo", "idV2LblPayTerm")
					).setRequired(true);
					MessageToast.show("Enter 'Discount' per box");
				} else {
					this.byId(
						sap.ui.core.Fragment.createId(
							"idV2FragGenInfo",
							"idV2SLPaymentTerm"
						)
					).setEnabled(true);
					this.byId(
						sap.ui.core.Fragment.createId("idV2FragGenInfo", "idV2LblPayTerm")
					).setRequired(true);
					MessageToast.show("Enter 'Discount' in Percentage");
				}
				if (this.sPreviousDistributionChannel) {
					MessageBox.confirm(
						"Products will be refreshed if Distributor Channel changed, Do you wish to continue ",
						{
							actions: ["Yes", "No"],
							onClose: function (oAction) {
								if (oAction === "Yes") {
									this.sPreviousDistributionChannel =
										sLastSelectedDistributionChannel;
									this.clearProducts();
									this.clearSummary();
								} else {
									if (this.sPreviousDistributionChannel) {
										this.getView()
											.getModel("JSONModelPayload")
											.setProperty(
												"/Vtweg",
												this.sPreviousDistributionChannel
											);
										// oEvent.getSource().setSelectedKey(this.sPreviousDistributionChannel);
									}
								}
							}.bind(this),
						}
					);
				} else {
					this.sPreviousDistributionChannel = oEvent
						.getSource()
						.getSelectedKey();
				}
			},
			onVerticalSelectChange: function (oEvent) {
				var sLastSelectedVertical = oEvent.getSource().getSelectedKey();
				oEvent.getSource().setValueState("None");
				if (this.sPreviousVertical) {
					MessageBox.confirm(
						"Products will be refreshed if Vertical changed, Do you wish to continue ",
						{
							actions: ["Yes", "No"],
							onClose: function (oAction) {
								if (oAction === "Yes") {
									this.sPreviousVertical = sLastSelectedVertical;
									this.clearProducts();
									this.clearSummary();
								} else {
									if (this.sPreviousVertical) {
										this.getView()
											.getModel("JSONModelPayload")
											.setProperty("/Spart", this.sPreviousVertical);
										// oEvent.getSource().setSelectedKey(this.sPreviousVertical);
									}
								}
							}.bind(this),
						}
					);
				} else {
					this.sPreviousVertical = oEvent.getSource().getSelectedKey();
				}
			},
			clearProducts: function () {
				var JSONData = this.getView().getModel("JSONModelPayload").getData();
				var oRow = {
					Mfrgr: "",
					Szmm: "",
					Mvgr2: "",
					Werks: "",
					Prodh1: "",
					CurVolFt: "",
					TotalVol: "",
					Disc: null,
					Discb: null,
					Commbox: null,
					Exfacsqft: null,
					Exdepsqft: null,
					Commboxp: null,
					Frgtsqft: null,
					Compname: null,
					Complanprice: null,
					Sbremark: null,
					Zzprodh4: "",
					Mvgr5: "",
					Isexdep: "",
				};
				JSONData.ET_SALES_COORD_ISET.results = [oRow];
				this.getView()
					.getModel("JSONModelPayload")
					.setData(JSON.parse(JSON.stringify(JSONData)));
			},
			//End: Distribution and Vertical Selection change
			onCancel: function () {
				var that = this;
				MessageBox.confirm("Are you sure you want to cancel?", {
					actions: ["Yes", "No"],
					onClose: function (oAction) {
						if (oAction === "Yes") {
							var oRouter = that.getOwnerComponent().getRouter();
							oRouter.navTo("RouteMain", {});
						}
					}.bind(this),
				});
			},

			clearRequestPayload: function () {
				var oRequestPayloadHeader = {
					"Pafvto": null,
					"Kunnr": "",
					"Pafvfrm": null,
					"Ti": "1",
					"Gst": "18",
					"Name": "",
					"Action": "",
					"Zterm": "",
					"Validity": "",
					"Aufnr": "",
					"Vtweg": "",
					"Vkbur": "",
					"Spart": "",
					"ET_SALES_COORD_ISET": {
						"results": []
					}
				}
				var oRequestPayloadItem = {
					"Mfrgr": "",
					"Szmm": "",
					"Mvgr2": "",
					"Werks": "",
					"Prodh1": "",
					"CurVolFt": "",
					"TotalVol": "",
					"Disc": null,
					"Discb": null,
					"Commbox": null,
					"Exfacsqft": null,
					"Exdepsqft": null,
					"Commboxp": null,
					"Frgtsqft": null,
					"Compname": null,
					"Complanprice": null,
					"Sbremark": null,
					"Zzprodh4": "",
					"Mvgr5": "",
					"Isexdep": ""
				}
				this.getView().getModel("payload").setProperty("/header", oRequestPayloadHeader);
				this.getView().getModel("payload").setProperty("/item", oRequestPayloadItem);
				this.getView().getModel("payload").updateBindings(true);
			},

			onClear: function () {
				this.sPreviousDistributionChannel = null;
				this.sPreviousVertical = null;
				var JSONData = {
					Pafvto: null,
					Kunnr: "",
					Pafvfrm: null,
					Ti: "1",
					Gst: "18",
					Name: "",
					Action: "",
					Zterm: "",
					Validity: "",
					Aufnr: "",
					Vtweg: "",
					Vkbur: "",
					Spart: "",
					ET_SALES_COORD_ISET: {
						results: [
							{
								Mfrgr: "",
								Szmm: "",
								Mvgr2: "",
								Werks: "",
								Prodh1: "",
								CurVolFt: "",
								TotalVol: "",
								Disc: null,
								Discb: null,
								Commbox: null,
								Exfacsqft: null,
								Exdepsqft: null,
								Commboxp: null,
								Frgtsqft: null,
								Compname: null,
								Complanprice: null,
								Sbremark: null,
								Zzprodh4: "",
								Mvgr5: "",
								Isexdep: "",
							},
						],
					},
				};
				this.getView().getModel("JSONModelPayload").setData(JSONData);
				this.getView().getModel("JSONModelPayload").updateBindings(true);
			},

			onBack: function () {
				this.oRouter = this.getOwnerComponent().getRouter();
				this.oRouter.navTo("RouteMain", {});
			},

			_getResourceBundle: function () {
				return this.getOwnerComponent()
					.getModel("i18nV2")
					.getResourceBundle();
			},

			onInvoiceLiveValidation: function (oEvent) {
				oEvent.getSource().setValueState("None");

				var value = Number(oEvent.getSource().getValue());
				var sValue = oEvent.getSource().getValue();
				if (sValue.includes(".")) {
					if (sValue.split(".")[1].length > 2) {
						MessageToast.show("Only 2 Decimal allowed");
						sValue = sValue.substring(0, sValue.length - 1);
						oEvent.getSource().setValue(sValue);
					}
				}

				if (isNaN(value)) {
					MessageBox.error("Only numeric values allowed");
					oEvent.getSource().setValue("");
				}
				var Vtweg = this.getView().getModel("JSONModelPayload").getProperty("/Vtweg");
				if (Vtweg === "15" || Vtweg === "19" || Vtweg === "25" || Vtweg === "29") {
					if (value > 100) {
						MessageBox.error("Percentage value not correct");
						oEvent.getSource().setValue("");
					}
				}
			},
			onOrcPerLiveValidation: function (oEvent) {
				var sValue = oEvent.getSource().getValue();
				if (sValue.includes(".")) {
					if (sValue.split(".")[1].length > 2) {
						MessageToast.show("Only 2 Decimal allowed");
						sValue = sValue.substring(0, sValue.length - 1);
						oEvent.getSource().setValue(sValue);
					}
				}
				oEvent.getSource().setValueState("None");

				var value = Number(oEvent.getSource().getValue());
				if (isNaN(value)) {
					MessageBox.error("Only numeric values allowed");
					oEvent.getSource().setValue("");
				}
				var Vtweg = this.getView().getModel("JSONModelPayload").getProperty("/Vtweg");
				if (Vtweg === "15" || Vtweg === "19" || Vtweg === "25" || Vtweg === "29") {
					if (value > 100) {
						MessageBox.error("Percentage value not correct");
						oEvent.getSource().setValue("");
					}
				}
			},

			onLiveChange: function (oEvent) {
				oEvent.getSource().setValueState("None");
			},

			onValidityNumber: function (oEvent) {
				var value = Number(oEvent.getSource().getValue());
				if (value) {
					oEvent.getSource().setValueState("None");
				}
				if (isNaN(value)) {
					MessageBox.error("Only numeric values allowed");
					oEvent.getSource().setValue("");
					bValid = false;
				}

				var sValue = oEvent.getSource().getValue();
				if (sValue.includes(".")) {
					MessageBox.error("Decimal numbers not allowed");
					oEvent.getSource().setValue("");
					bValid = false;
				}
			},
			onNumberValidation: function (oEvent) {
				var sValue = oEvent.getSource().getValue();
				if (sValue.includes(".")) {
					if (sValue.split(".")[1].length > 2) {
						MessageToast.show("Only 2 Decimal allowed");
						sValue = sValue.substring(0, sValue.length - 1);
						oEvent.getSource().setValue(sValue);
					}
				}
				oEvent.getSource().setValueState("None");
				var value = Number(oEvent.getSource().getValue());
				if (isNaN(value)) {
					MessageBox.error("Only numeric values allowed");
					oEvent.getSource().setValue("");
				}
				// else if (value > 99) {
				//     MessageBox.error("Please enter value less than 100");
				//     oEvent.getSource().setValue("");
				// }
			},

			onFrgtValidation: function (oEvent) {
				var sValue = oEvent.getSource().getValue();
				if (sValue.includes(".")) {
					if (sValue.split(".")[1].length > 2) {
						MessageToast.show("Only 2 Decimal allowed");
						sValue = sValue.substring(0, sValue.length - 1);
						oEvent.getSource().setValue(sValue);
					}
				}
				oEvent.getSource().setValueState("None");
				var value = Number(oEvent.getSource().getValue());
				if (isNaN(value)) {
					MessageBox.error("Only numeric values allowed");
					oEvent.getSource().setValue(null);
				}
				// else if (value > 99) {
				//     MessageBox.error("Please enter value less than 100");
				//     oEvent.getSource().setValue("");
				// }
			},
			onAddRow: function () {
				var headerValidationStatus = validation.headerPayloadValidation(this);
				if (headerValidationStatus === 1) {
					var aData = this.getView().getModel("JSONModelPayload").getData()
						.ET_SALES_COORD_ISET.results;
					var itemValidationStatus = validation.itemsPayloadValidation(
						aData,
						this,
						"Adding new line"
					);
					if (itemValidationStatus === 1) {
						var JSONData = this.getView()
							.getModel("JSONModelPayload")
							.getData();
						var nRowIndex = this.getView()
							.getModel("JSONModelPayload")
							.getData().ET_SALES_COORD_ISET.results.length;
						JSONData.ET_SALES_COORD_ISET.results.push({
							Mfrgr: "",
							Szmm: "",
							Mvgr2: "",
							Werks: "",
							Prodh1: "",
							CurVolFt: "",
							TotalVol: "",
							Disc: null,
							Discb: null,
							Commbox: null,
							Exfacsqft: null,
							Exdepsqft: null,
							Commboxp: null,
							Frgtsqft: null,
							Compname: null,
							Complanprice: null,
							Sbremark: null,
							Zzprodh4: "",
							Mvgr5: "",
							Isexdep: "",
						});

						this.getView()
							.getModel("JSONModelPayload")
							.setData(JSON.parse(JSON.stringify(JSONData)));

						this.byId(
							sap.ui.core.Fragment.createId("idV2FragAddPrdDetails", "idV2SC")
						).scrollTo(0, 0, 500);
					}
				}
			},

			onDelete: function (oEvent) {

				var vLen = oEvent
					.getSource()
					.getParent()
					.getBindingContextPath()
					.split("/").length;

				var index = Number(
					oEvent.getSource().getParent().getBindingContextPath().split("/")[
					vLen - 1
					]
				);

				var JSONData = this.getView().getModel("JSONModelPayload").getData();
				if (JSONData.ET_SALES_COORD_ISET.results.length > 1) {
					// Start: Delete001
					// New
					if (this.sID && this.sID !== 'null') {
						JSONData.ET_SALES_COORD_ISET.results[index].Loekz = true;
					} else {
						JSONData.ET_SALES_COORD_ISET.results.splice(index, 1);
					}
					// Old
					// JSONData.ET_SALES_COORD_ISET.results.splice(index, 1);
					// End: Delete001
				} else {
					MessageBox.error("Atlease one entry is required");
				}

				this.getView().getModel("JSONModelPayload").setData(JSON.parse(JSON.stringify(JSONData)));

				// Start: Delete001
				var sPath = "Loekz";
				var oTable = this.byId(
					sap.ui.core.Fragment.createId(
						"idV2FragAddPrdDetails",
						"idV2TblProducts"
					)
				);
				var aFilters = [];
				var oBinding = oTable.getBinding("items");
				var oFilter = new sap.ui.model.Filter(sPath, sap.ui.model.FilterOperator.NE, true);
				aFilters.push(oFilter);
				oBinding.filter(aFilters);
				// End: Delete001

				// Date format corrector
				var data = this.getView().getModel("JSONModelPayload").getData();
				data.Pafvto = new Date(data.Pafvto);
				data.Pafvfrm = new Date(data.Pafvfrm);
				var aItems = data.ET_SALES_COORD_ISET.results;
				for (let index = 0; index < aItems.length; index++) {
					for (const key in aItems[index]) {
						if (Object.hasOwnProperty.call(aItems[index], key)) {
							if (key === "Erdat") {
								aItems[index].Erdat = new Date(aItems[index].Erdat);
							}
						}
					}
				}
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

			//Start: Sales Office
			// on Value Help(F4)
			onSalesOfficeHelp: function () {
				salesOffice.onSalesOfficeHelp(this);
			},
			// on Submit
			onSalesOfficeInputSubmit: function (oEvent) {
				salesOffice.salesOffice_submitCall(oEvent, this);
			},
			// on F4 search/liveChange
			onValueHelpSearch_salOffice: function (oEvent) {
				salesOffice.onSalesOfficeHelpSearch(oEvent, this);
			},
			// on F4 confirm
			onValueHelpConfirm_salOffice: function (oEvent) {
				salesOffice.onSalesOfficeValueHelpConfirm(oEvent, this);
			},
			// On Suggest
			onSuggest_salesOffice: function (oEvent) {
				salesOffice.onSuggest_salesOffice(oEvent, this);
			},

			// On live change
			onSalesOfficeLiveChange: function (oEvent) {
				salesOffice.onSalesOfficeLiveChange(oEvent);
			},
			//End: Sales Office

			// Start: Material Freight Group

			// on Value Help(F4)
			onMaterialFreightGroupsHelp: function (oEvent) {
				materialFreightGroup.onMaterialFreightGroupsHelp(oEvent, this);
			},
			// on F4 search/liveChange
			onMaterialFreightGroupsValueHelpSearch: function (oEvent) {
				materialFreightGroup.onMaterialFreightGroupsValueHelpSearch(
					oEvent,
					this
				);
			},
			// on F4 confirm
			onMaterialFreightGroupsHelpConfirm: function (oEvent) {
				materialFreightGroup.onMaterialFreightGroupsHelpConfirm(oEvent, this);
			},
			// On Suggest
			onSuggest_MaterialFreightGroups: function (oEvent) {
				materialFreightGroup.onSuggest_MaterialFreightGroups(oEvent, this);
			},
			// Submit action
			onMaterialFreightGroupInputSubmit: function (oEvent) {
				materialFreightGroup.onMaterialFreightGroupInputSubmit(oEvent, this);
			},
			// On change
			onMaterialFreightInputChange: function (oEvent) {
				if (oEvent.getSource().getValue()) {
					oEvent.getSource().setValueState("None");
				}
				materialFreightGroup.onMaterialFreightInputChange(oEvent, this);
			},
			// on Suggestion select
			onMaterialFreightInputSuggestionSelect: function (oEvent) {
				materialFreightGroup.onMaterialFreightInputSuggestionSelect(
					oEvent,
					this
				);
			},
			// On live change
			onMaterialFreightGroupsLiveChange: function (oEvent) {
				materialFreightGroup.onMaterialFreightGroupsLiveChange(oEvent);
			},

			// End: Material Freight Group

			// Start: Designs

			// on Value Help(F4)
			onDesignsHelp: function (oEvent) {

				// Designs.onDesignsHelp(oEvent, this);
				var that = this;
				var sPath = oEvent.getSource().getParent().getBindingContextPath();
				var Mfrgr = that.getView().getModel("JSONModelPayload").getContext(sPath).getProperty("Mfrgr");
				that.Mfrgr = oEvent.getSource().getParent().getBindingContextPath() + "/Mfrgr";
				that.bindingContextPath = oEvent.getSource().getParent().getBindingContextPath() + "/Mvgr2";
				if (Mfrgr) {

					var oResourceModel = that.getView().getModel("i18nV2").getResourceBundle();
					if (!that.oFragmentDesign) {
						that.oFragmentDesign = sap.ui.xmlfragment("zpj.pro.sk.sd.salesco.zprosalesco.view.fragments.View2.F4s.designsF4", that);
						that.oFragmentDesign.setTitle(oResourceModel.getText("view2.F4.title.designs"));
						that.getView().addDependent(that.SalesOfficerag);
						that._DesignsTemp = sap.ui.getCore().byId("idSLDesignsValueHelp").clone();
						that._oTempDesign = sap.ui.getCore().byId("idSLDesignsValueHelp").clone();
					}
					var aFilter = [];
					var oFilterDomname = new sap.ui.model.Filter([new sap.ui.model.Filter("Domname", sap.ui.model.FilterOperator.EQ, "ZMATSOURCE")], false);
					var oFilterDomname1 = new sap.ui.model.Filter([new sap.ui.model.Filter("Domname1", sap.ui.model.FilterOperator.EQ, "")], false);
					var oFilterDomname2 = new sap.ui.model.Filter([new sap.ui.model.Filter("Domname2", sap.ui.model.FilterOperator.EQ, Mfrgr)], false);
					aFilter.push(oFilterDomname);
					aFilter.push(oFilterDomname1);
					aFilter.push(oFilterDomname2);
					that.oFragmentDesign.setModel(that.getView().getModel());
					sap.ui.getCore().byId("idSDDesignsF4").bindAggregation("items", {
						path: "/ET_VALUE_HELPSSet",
						filters: aFilter,
						template: that._DesignsTemp
					});
					that.oFragmentDesign.open();

				} else {
					MessageBox.error("Please select 'Material Freight Group' first");
				}
			},
			// on F4 search/liveChange
			onValueHelpSearchDesing: function (oEvent) {
				Designs.onValueHelpSearchDesing(oEvent, this);
			},
			// on F4 confirm
			onDesignsHelpConfirm: function (oEvent) {
				Designs.onDesignsHelpConfirm(oEvent, this);
			},
			// On Suggest
			onSuggest_Designs: function (oEvent) {
				Designs.onSuggest_Designs(oEvent, this);
			},

			// Submit action
			onDesignsInputSubmit: function (oEvent) {
				Designs.onDesignsInputSubmit(oEvent, this);
			},
			// On live change
			onDesignsLiveChange: function (oEvent) {
				Designs.onDesignsLiveChange(oEvent);
			},
			// End: Designs

			//Start: Supply Plant

			// on Value Help(F4)
			onSupplyPlantHelp: function (oEvent) {
				supplyPlant.onSupplyPlantHelp(oEvent, this);
			},
			// on F4 search/liveChange
			onSupplyPlantValueHelpSearch: function (oEvent) {
				supplyPlant.onSupplyPlantValueHelpSearch(oEvent, this);
			},
			// on F4 confirm
			onSupplyPlantHelpConfirm: function (oEvent) {
				supplyPlant.onSupplyPlantHelpConfirm(oEvent, this);
			},

			// On Suggest
			onSuggest_SupplyPlant: function (oEvent) {
				supplyPlant.onSuggest_SupplyPlant(oEvent, this);
			},
			// Submit action
			onSupplyPlantInputSubmit: function (oEvent) {
				supplyPlant.onSupplyPlantInputSubmit(oEvent, this);
			},

			// On live change
			onSupplyPlantLiveChange: function (oEvent) {
				supplyPlant.onSupplyPlantLiveChange(oEvent);
			},

			//End: Supply Plant

			//Start: Manufacturing Plant
			// on Value Help(F4)
			onManufacturingAmtHelp: function (oEvent) {
				manufacturingPlant.onManufacturingAmtHelp(oEvent, this);
			},
			// on F4 search/liveChange
			onManufacturingPlantValueHelpSearch: function (oEvent) {
				manufacturingPlant.onManufacturingPlantValueHelpSearch(oEvent, this);
			},

			// on F4 confirm
			onManufacturingAmtHelpConfirm: function (oEvent) {
				manufacturingPlant.onManufacturingAmtHelpConfirm(oEvent, this);
			},
			// On Suggest

			onSuggest_ManufacturingPlant: function (oEvent) {
				manufacturingPlant.onSuggest_ManufacturingPlant(oEvent, this);
			},

			// Submit action
			onManufacturingPlantInputSubmit: function (oEvent) {
				manufacturingPlant.onManufacturingPlantInputSubmit(oEvent, this);
			},

			// On live change
			onManufacturingPlantLiveChange: function (oEvent) {
				manufacturingPlant.onManufacturingPlantLiveChange(oEvent);
			},

			//End: Manufacturing Plant

			// Start: Part
			onPartSelectChange: function (oEvent) {
				part.onPartSelectChange(oEvent, this);
			},
			// End: Part

			// Start: Quality
			onQualitySelectChange: function (oEvent) {
				quality.onQualitySelectChange(oEvent, this);
			},
			// End: Quality

			onRadioButtonGroupSelect: function (oEvent) {
				if (oEvent.getSource().getSelectedIndex() === 0) {
					this.getView().getModel("JSONModelPayload").getData().Isexdep = "F";
				} else {
					this.getView().getModel("JSONModelPayload").getData().Isexdep = "D";
				}
			},

			onSave: function () {
				// Start: Discount001
				var aTableItems = this.getView()
					.getModel("JSONModelPayload")
					.getData().ET_SALES_COORD_ISET.results;
				var nLen = aTableItems.length;
				for (var i = 0; i < nLen; i++) {
					if (aTableItems[i].Discb) {
						if (Number(aTableItems[i].Discb) > 0) {
							aTableItems[i].Disc = aTableItems[i].Discb;
							aTableItems[i].Discb = null;
						}

					}

				}
				// End: Discount001
				this.onGenerateBeforeSave();
			},
			onGenerateBeforeSave: function () {
				var headerValidationStatus = validation.headerPayloadValidation(this);

				if (headerValidationStatus === 1) {
					// Date format corrector
					var data = this.getView().getModel("JSONModelPayload").getData();
					data.Pafvto = new Date(data.Pafvto);
					data.Pafvfrm = new Date(data.Pafvfrm);
					data.PafnoRef = this.getView().getModel("viewModel").getProperty("/PafnoRef") || "";
					var aItems = data.ET_SALES_COORD_ISET.results;
					for (let index = 0; index < aItems.length; index++) {
						for (const key in aItems[index]) {
							if (Object.hasOwnProperty.call(aItems[index], key)) {
								if (key === "Erdat") {
									aItems[index].Erdat = new Date(aItems[index].Erdat);
								}
							}
						}
					}
					this.getView().getModel("JSONModelPayload").refresh(true);
					var aData = this.getView().getModel("JSONModelPayload").getData()
						.ET_SALES_COORD_ISET.results;



					var itemValidationStatus = validation.itemsPayloadValidation(
						aData,
						this,
						"Generate"
					);
					if (itemValidationStatus === 1) {
						this.getView().byId("idV2OPSAttach").setVisible(true);
						this.getView().getModel("JSONModelPayload").getData().Action =
							"GENERATE";

						// Disc and Discb convertion
						var aTableItems = this.getView()
							.getModel("JSONModelPayload")
							.getData().ET_SALES_COORD_ISET.results;
						var nLen = aTableItems.length;
						for (var j = 0; j < nLen; j++) {
							if (aTableItems[j].Isexdep === "") {
								aTableItems[j].Isexdep = " ";
							}
						}
						var Vtweg = this.getView().getModel("JSONModelPayload").getProperty("/Vtweg");
						if (Vtweg === "15" || Vtweg === "19" || Vtweg === "25" || Vtweg === "29") {

						} else {
							for (var i = 0; i < nLen; i++) {
								aTableItems[i].Discb = aTableItems[i].Disc;
								aTableItems[i].Disc = null;
							}
						}

						var sPath = "/ET_SALES_COORD_HEADERSet";
						//Start: Mandatefields001
						var DistChannel = this.getView().getModel("JSONModelPayload").getProperty("/Vtweg");
						var PONo = this.getView().getModel("JSONModelPayload").getProperty("/Aufnr")
						var oppID = this.getView().getModel("JSONModelPayload").getProperty("/Oppu");
						var projectInfo = this.getView().getModel("JSONModelPayload").getProperty("/Proj");
						var specifierInfo = this.getView().getModel("JSONModelPayload").getProperty("/Spec");

						// var aAttachmentsItems = this
						//   .getView()
						//   .getModel("LocalJSONModelForAttachment").getProperty("/attachments/Nav_File_Upload/results");
						var aAttachmentsItems = this.getView().getModel("oDOAAAttachmentModel").getData();
						// .getData().attachments.Nav_File_Upload.results;

						var bStatus = true;
						if (DistChannel === "15" || DistChannel === "17" || DistChannel === "25" || DistChannel === "27" || DistChannel === "29") {
							if (!PONo) {
								MessageBox.error("'Purchase Order No' is mandatory for selected distribution channel");
								bStatus = false;
							} else if (!oppID) {
								MessageBox.error("'Oppurtunity ID' is mandatory for selected distribution channel");
								bStatus = false;
							} else if (!projectInfo) {
								MessageBox.error("'Project Name and Address' is mandatory for selected distribution channel");
								bStatus = false;
							}
							// else if (!specifierInfo) {
							//   MessageBox.error("'Project Specifier name and Address' is mandatory for selected distribution channel");
							//   bStatus = false;
							// } 
							else if (aAttachmentsItems.length < 1) {
								MessageBox.error("'Attachment' is mandatory for selected distribution channel");
								bStatus = false;
							}
							else {
								bStatus = true;
							}
						}
						if (bStatus) {
							// old
							this.getView().setBusy(true);
							this.getView()
								.getModel()
								.create(
									sPath,
									this.getView().getModel("JSONModelPayload").getData(),
									{
										async: false,
										success: function (oData) {
											var aTableItems = oData.ET_SALES_COORD_ISET.results;
											var nLen = aTableItems.length;
											for (var j = 0; j < nLen; j++) {
												if (aTableItems[j].Isexdep === "") {
													aTableItems[j].Isexdep = " ";
												}
											}
											// Disc and Discb  conversion
											if (oData.Vtweg === "15" || oData.Vtweg === "19" || oData.Vtweg === "25" || oData.Vtweg === "29") {
											} else {
												var aTableItems = oData.ET_SALES_COORD_ISET.results;
												var nLen = aTableItems.length;
												for (var i = 0; i < nLen; i++) {
													aTableItems[i].Disc = aTableItems[i].Discb;
													aTableItems[i].Discb = null;
												}
											}
											this.getView().setBusy(false);
											this.getView()
												.getModel("JSONModelPayload")
												.setData(oData);

											this.getView().getModel("JSONModelPayload").refresh(true);

											this.getView()
												.getModel("viewModel")
												.setProperty("/Editable", false);
											this.getView()
												.getModel("GlobalEditableModel")
												.setProperty("/Editable", false);

											this.getView().byId("idV2Bar").setVisible(true);
											this.getView().byId("idV2BtnSave").setVisible(true);
											this.getView().byId("FileUploaderId").setVisible(false);
											// this.getView().byId("id.excelExport.Link").setVisible(false);
											this.getView().byId("idV2OPSSumDetail").setVisible(true);
											this._displaySummaryDetails();
											this.onSaveAfterGenerate();
										}.bind(this),
										error: function (oError) {


											this.getView().setBusy(false);
											this.getView().byId("idV2BtnSave").setVisible(false);
											var sErrorMessage = JSON.parse(oError.responseText).error
												.innererror.errordetails[0].message;
											if (sErrorMessage) {
												MessageBox.error(sErrorMessage, {
													actions: [sap.m.MessageBox.Action.OK],
													onClose: function (oAction) {

													},
												});
											} else {
												MessageBox.error(
													"Something went wrong, Please refresh browser and try again",
													{
														actions: [sap.m.MessageBox.Action.OK],
														onClose: function (oAction) {

														},
													}
												);
											}
										}.bind(this),
									}
								);
						}
						//End: Mandatefields001
					}
				}
			},
			onSaveAfterGenerate: function () {
				var headerValidationStatus = validation.headerPayloadValidation(this);

				if (headerValidationStatus === 1) {
					var aData = this.getView().getModel("JSONModelPayload").getData()
						.ET_SALES_COORD_ISET.results;
					var itemValidationStatus = validation.itemsPayloadValidation(
						aData,
						this,
						"Save"
					);
					if (itemValidationStatus === 1) {
						this.getView().getModel("JSONModelPayload").getData().Action =
							"SAVE";
						var aTableItems = this.getView()
							.getModel("JSONModelPayload")
							.getData().ET_SALES_COORD_ISET.results;
						var nLen = aTableItems.length;
						for (var j = 0; j < nLen; j++) {
							if (aTableItems[j].Isexdep === "") {
								aTableItems[j].Isexdep = " ";
							}
						}
						var Vtweg = this.getView().getModel("JSONModelPayload").getProperty("/Vtweg");
						if (Vtweg === "15" || Vtweg === "19" || Vtweg === "25" || Vtweg === "29") {
						} else {
							for (var i = 0; i < nLen; i++) {
								aTableItems[i].Discb = aTableItems[i].Disc;
								aTableItems[i].Disc = null;
							}
						}
						var sPath = "/ET_SALES_COORD_HEADERSet";
						var that = this;
						this.getView()
							.getModel()
							.create(
								sPath,
								this.getView().getModel("JSONModelPayload").getData(),
								{
									async: false,
									success: function (oData) {
										// var aAttachmentsItems = that.getView().getModel("LocalJSONModelForAttachment").getData().attachments.Nav_File_Upload.results;

										var aAttachmentsItems = that.getView().getModel("oDOAAAttachmentModel").getData();
										if (aAttachmentsItems.length > 0) {
											that
												.getView()
												.getModel("LocalJSONModelForAttachment")
												.getData().attachments.Pafno = oData.Pafno;
											for (var i = 0; i < aAttachmentsItems.length; i++) {
												aAttachmentsItems[i].Pafno = oData.Pafno;
											}

											var _attachmentPayload = { Nav_File_Upload: { results: aAttachmentsItems } };

											// that
											//   .getView()
											//   .getModel("LocalJSONModelForAttachment")
											//   .getData().attachments;

											var sPathUpload = "/ETFILE_UPLOAD_HSet";
											that.getView().setBusy(true);
											that
												.getView()
												.getModel("ZFILE_UPLOAD_SRV_01")
												.create(sPathUpload, _attachmentPayload, {
													async: false,
													success: function (Data) {
														that.getView().setBusy(false);

														MessageBox.success(
															"Request saved successfully with PAF Number:" +
															oData.Pafno.replace(/^0+/, "") +
															"",
															{
																actions: [sap.m.MessageBox.Action.OK],
																onClose: function (oAction) {
																	// window.location.reload();
																	that.getOwnerComponent().getRouter().navTo("RouteMain", {});
																}.bind(this),
															}
														);
													},
													error: function (oError) {
														that.getView().setBusy(false);
														var sErrorMessage = JSON.parse(
															oError.responseText
														).error.innererror.errordetails[0].message;
														if (sErrorMessage) {
															MessageBox.error(sErrorMessage, {
																actions: [sap.m.MessageBox.Action.OK],
																onClose: function (oAction) { },
															});
														} else {
															MessageBox.error(
																"Something went wrong, Please refresh browser and try again",
																{
																	actions: [sap.m.MessageBox.Action.OK],
																	onClose: function (oAction) { },
																}
															);
														}
													},
												});
										}
										else {
											MessageBox.success(
												"Request saved successfully with PAF Number:" +
												oData.Pafno.replace(/^0+/, "") +
												"",
												{
													actions: [sap.m.MessageBox.Action.OK],
													onClose: function (oAction) {
														// window.location.reload();
														that.getOwnerComponent().getRouter().navTo("RouteMain", {});
													},
												}
											);
										}
									},
									error: function (oError) {
										that.getView().setBusy(false);
										var sErrorMessage = JSON.parse(oError.responseText).error
											.innererror.errordetails[0].message;
										if (sErrorMessage) {
											MessageBox.error(sErrorMessage, {
												actions: [sap.m.MessageBox.Action.OK],
												onClose: function (oAction) { },
											});
										} else {
											MessageBox.error(
												"Something went wrong, Please refresh browser and try again",
												{
													actions: [sap.m.MessageBox.Action.OK],
													onClose: function (oAction) { },
												}
											);
										}
									},
								}
							);
					}
				}
			},

			fireAllInputs: function () {
				// come back here
				this.byId(
					sap.ui.core.Fragment.createId("idV2FragGenInfo", "idV2InpCustCode")
				).fireSubmit();
				this.byId(
					sap.ui.core.Fragment.createId(
						"idV2FragGenInfo",
						"idV2InpSalesOffice"
					)
				).fireSubmit();
			},

			onGenerate: function () {
				// Start: Discount001
				var aTableItems = this.getView().getModel("JSONModelPayload").getData().ET_SALES_COORD_ISET.results;
				var nLen = aTableItems.length;

				for (var i = 0; i < nLen; i++) {
					if (aTableItems[i].Discb) {
						if (Number(aTableItems[i].Discb) > 0) {
							aTableItems[i].Disc = aTableItems[i].Discb;
							aTableItems[i].Discb = null;
						}
					}
				}
				// End: Discount001
				try {
					var vStatus = this.onValidate();
					if (vStatus != 0) {
						// var vSalesOffice = this.byId(sap.ui.core.Fragment.createId("idV2FragGenInfo", "idV2InpSalesOffice")).getValue().match(/\d+/)[0];

						var vSalesOffice = this.byId(sap.ui.core.Fragment.createId("idV2FragGenInfo", "idV2InpSalesOffice")).getValue();
						if (!this.getView().getModel("JSONModelPayload").getData().Vkbur) {
							this.getView().getModel("JSONModelPayload").getData().Vkbur = vSalesOffice;
						}
						// var vSalesOfficeBE = this.getView().getModel("JSONModelPayload").getData().Vkbur

						if (vSalesOffice) {
							this.byId(sap.ui.core.Fragment.createId("idV2FragGenInfo", "idV2InpSalesOffice")).setValueState("None");
							//
							var headerValidationStatus = validation.headerPayloadValidation(this);


							var paymentTerm = this.byId(sap.ui.core.Fragment.createId("idV2FragGenInfo", "idV2SLPaymentTerm")).setValueState("Error").getSelectedKey();

							if (!paymentTerm) {
								MessageBox.error("Please enter Payment Term");
								this.byId(sap.ui.core.Fragment.createId("idV2FragGenInfo", "idV2SLPaymentTerm")).setValueState("Error");
							} else {
								this.byId(sap.ui.core.Fragment.createId("idV2FragGenInfo", "idV2SLPaymentTerm")).setValueState("None");

								if (headerValidationStatus === 1) {
									// Date format corrector
									var data = this.getView().getModel("JSONModelPayload").getData();
									data.Pafvto = new Date(data.Pafvto);
									data.Pafvfrm = new Date(data.Pafvfrm);
									var aItems = data.ET_SALES_COORD_ISET.results;

									for (let index = 0; index < aItems.length; index++) {
										for (const key in aItems[index]) {
											if (Object.hasOwnProperty.call(aItems[index], key)) {
												if (key === "Erdat") {
													aItems[index].Erdat = new Date(aItems[index].Erdat);
												}
											}
										}
									}
									this.getView().getModel("JSONModelPayload").refresh(true);
									var aData = this.getView().getModel("JSONModelPayload").getData().ET_SALES_COORD_ISET.results;

									var itemValidationStatus = validation.itemsPayloadValidation(aData, this, "Generate");

									if (itemValidationStatus === 1) {
										this.getView().byId("idV2OPSAttach").setVisible(true);
										this.getView().getModel("JSONModelPayload").getData().Action = "GENERATE";

										var aTableItems = this.getView().getModel("JSONModelPayload").getData().ET_SALES_COORD_ISET.results;
										var nLen = aTableItems.length;

										for (var j = 0; j < nLen; j++) {
											if (aTableItems[j].Isexdep === "") {
												aTableItems[j].Isexdep = " ";
											}
										}
										// Disc and Discb convertion
										var Vtweg = this.getView().getModel("JSONModelPayload").getProperty("/Vtweg");
										if (Vtweg === "15" || Vtweg === "19" || Vtweg === "25" || Vtweg === "29") {
										} else {
											for (var i = 0; i < nLen; i++) {
												aTableItems[i].Discb = aTableItems[i].Disc;
												aTableItems[i].Disc = null;
											}
										}

										var sPath = "/ET_SALES_COORD_HEADERSet";
										this.getView().setBusy(true);

										this.getView().getModel().create(
											sPath,
											this.getView().getModel("JSONModelPayload").getData(), {
											async: false,
											success: function (oData) {
												var aTableItems =
													oData.ET_SALES_COORD_ISET.results;
												var nLen = aTableItems.length;
												for (var j = 0; j < nLen; j++) {
													if (aTableItems[j].Isexdep === "") {
														aTableItems[j].Isexdep = " ";
													}
												}
												// Disc and Discb  conversion
												if (oData.Vtweg === "15" || oData.Vtweg === "19" || oData.Vtweg === "25" || oData.Vtweg === "29") {
												} else {
													for (var i = 0; i < nLen; i++) {
														aTableItems[i].Disc = aTableItems[i].Discb;
														aTableItems[i].Discb = null;
													}
												}

												this.getView().setBusy(false);
												oData.Validity = oData.Validity.replace(
													/^0+/,
													""
												);

												this.getView().getModel("JSONModelPayload").setData(oData);
												this.getView().getModel("JSONModelPayload").refresh(true);

												this.getView().getModel("viewModel").setProperty("/Editable", false);
												this.getView().getModel("GlobalEditableModel").setProperty("/Editable", false);

												this.getView().byId("idV2Bar").setVisible(true);
												this.getView().byId("idV2BtnSave").setVisible(true);
												this.getView().byId("FileUploaderId").setVisible(false);
												// this.getView().byId("id.excelExport.Link").setVisible(false);

												this.getView().byId("idV2OPSSumDetail").setVisible(true);
												// this.getView()
												//   .byId("idV2BtnEdit")
												//   .setVisible(true);

												this.getView().getModel("viewModel").setProperty("/editButton", true)
												this.byId(sap.ui.core.Fragment.createId("idV2FragAddPrdDetails", "idV2SC")).scrollTo(0, 0, 500);
												this._displaySummaryDetails();

											}.bind(this),
											error: function (oError) {
												this.getView().setBusy(false);
												this.getView().byId("idV2BtnSave").setVisible(false);

												if (JSON.parse(oError.responseText).error.innererror.errordetails.length > 0) {
													var sErrorMessage = JSON.parse(oError.responseText).error.innererror.errordetails[0].message;
												} else {
													var sErrorMessage = "Something went wrong, Please check and try again with correct data";
												}

												// if (this.vTemp === 1) {
												// 	// Come back here
												// 	this.vTemp += 1;

												if (sErrorMessage) {
													MessageBox.error(sErrorMessage, {
														actions: [sap.m.MessageBox.Action.OK],
														onClose: function (oAction) { },
													});
												} else {
													MessageBox.error("Something went wrong, Please refresh browser and try again", {
														actions: [sap.m.MessageBox.Action.OK],
														onClose: function (oAction) { },
													});
												}
												// }
											}.bind(this),
										});
									}
								}
							}
						} else {
							this.byId(sap.ui.core.Fragment.createId("idV2FragGenInfo", "idV2InpSalesOffice")).setValueState("Error");
							MessageBox.error("Please enter Sales Office");
						}
					}
				} catch (error) {
					MessageBox.error("Please enter Sales Office");
				}
			},
			onValidate: function () {
				var aModelData = this.getView()
					.getModel("JSONModelPayload")
					.getProperty("/ET_SALES_COORD_ISET/results");
				for (var j = 0; j < aModelData.length; j++) {
					var sSelectedValue = aModelData[j].Mfrgr,
						sPart = aModelData[j].Mvgr5,
						sManufacturingPlant = aModelData[j].Prodh1,
						sSelectedValueQuality = aModelData[j].Zzprodh4;
					for (var i = j + 1; i < aModelData.length; i++) {
						console.log(i);
						if (
							sSelectedValue === aModelData[i].Mfrgr &&
							sPart === aModelData[i].Mvgr5 &&
							sManufacturingPlant === aModelData[i].Prodh1.toUpperCase() &&
							sSelectedValueQuality === aModelData[i].Zzprodh4 &&
							i != Number(j)
						) {
							MessageBox.error(
								"At line number:" +
								j +
								", Material Freigth Group:- '" +
								sSelectedValue +
								"' and Manufacturing Plant:-'" +
								sManufacturingPlant +
								"' and Part:-'" +
								sPart +
								"' and Quality:-'" +
								sSelectedValueQuality +
								"' combination already selected"
							);
							aModelData[j].Mfrgr = "";
							aModelData[j].Mvgr5 = "";
							aModelData[j].Prodh1 = "";
							aModelData[j].Zzprodh4 = "";
							this.getView()
								.getModel("JSONModelPayload")
								.setProperty("/ET_SALES_COORD_ISET/results", aModelData);
							return 0;
						}
					}
				}
			},

			_displaySummaryDetails: function () {
				var vInvoiceDiscount = 0;
				var vOrc = 0;
				var vFreightDiscount = 0;
				var vPayTermDiscount = 0;
				var vTotalValume = 0;
				var aItemsData = this.getView().getModel("JSONModelPayload").getData()
					.ET_SALES_COORD_ISET.results;
				for (let index = 0; index < aItemsData.length; index++) {
					// Disc and Discb conversion
					var vInvoiceType;
					var vOrcType;
					var Vtweg = this.getView()
						.getModel("JSONModelPayload")
						.getProperty("/Vtweg")
					if (Vtweg !== "15" || Vtweg !== "19" || Vtweg !== "25" || Vtweg !== "29") {
						vInvoiceDiscount =
							vInvoiceDiscount +
							Number(aItemsData[index].Disc) *
							Number(aItemsData[index].TotalVol);
						vInvoiceType = "Per Box";
					} else {
						vInvoiceDiscount =
							vInvoiceDiscount +
							(Number(aItemsData[index].Disc) *
								Number(aItemsData[index].TotalVol)) /
							100;

						vInvoiceType = "%";
					}
					var Vtweg = this.getView().getModel("JSONModelPayload").getProperty("/Vtweg");
					if (Vtweg === "15" || Vtweg === "19" || Vtweg === "25" || Vtweg === "29") {
						vOrc =
							vOrc +
							(Number(aItemsData[index].Commboxp) *
								Number(aItemsData[index].TotalVol)) /
							100;
						vOrcType = "%";
					} else {
						vOrc =
							vOrc +
							Number(aItemsData[index].Commbox) *
							Number(aItemsData[index].TotalVol);
						vOrcType = "Per Box";
					}

					vPayTermDiscount =
						vPayTermDiscount + Number(aItemsData[index].CashDiscount);
					vFreightDiscount =
						vFreightDiscount +
						Number(aItemsData[index].Frgtsqft) *
						Number(aItemsData[index].TotalVol);
					vTotalValume = vTotalValume + Number(aItemsData[index].TotalVol);
				}

				vInvoiceDiscount = vInvoiceDiscount / vTotalValume;
				vOrc = (vOrc / vTotalValume).toFixed(2);

				vFreightDiscount = (vFreightDiscount / vTotalValume).toFixed(2);
				vPayTermDiscount = (vPayTermDiscount / aItemsData.length).toFixed(2);
				if (
					vInvoiceDiscount === NaN ||
					vInvoiceDiscount === 0 ||
					vInvoiceDiscount === "" ||
					vInvoiceDiscount === undefined
				) {
					vInvoiceDiscount = "Not Available";
				}
				if (vOrc === NaN || vOrc === 0 || vOrc === "" || vOrc === undefined) {
					vOrc = "Not Available";
				}
				if (
					vFreightDiscount === NaN ||
					vFreightDiscount === 0 ||
					vFreightDiscount === "" ||
					vFreightDiscount === undefined
				) {
					vFreightDiscount = "Not Available";
				}
				if (
					vPayTermDiscount === NaN ||
					vPayTermDiscount === 0 ||
					vPayTermDiscount === "" ||
					vPayTermDiscount === undefined
				) {
					vPayTermDiscount = "Not Available";
				}
				if (vInvoiceType === "%") {
					vInvoiceDiscount = Number(vInvoiceDiscount) * 100;
					vInvoiceDiscount = vInvoiceDiscount.toFixed(2);
					this.byId(
						sap.ui.core.Fragment.createId(
							"idV2FragSumDeatil",
							"idV2InpInvcDis"
						)
					).setValue(vInvoiceDiscount.toString() + vInvoiceType);
				} else {
					vInvoiceDiscount = Number(vInvoiceDiscount).toFixed(2);
					this.byId(
						sap.ui.core.Fragment.createId(
							"idV2FragSumDeatil",
							"idV2InpInvcDis"
						)
					).setValue(vInvoiceDiscount.toString() + vInvoiceType);
				}
				if (vOrcType === "%") {
					vOrc = vOrc * 100;
					vOrc = Number(vOrc).toFixed(2);
					this.byId(
						sap.ui.core.Fragment.createId("idV2FragSumDeatil", "idV2InpOrc")
					).setValue(vOrc.toString() + vOrcType);
				} else {
					vOrc = Number(vOrc).toFixed(2);
					this.byId(
						sap.ui.core.Fragment.createId("idV2FragSumDeatil", "idV2InpOrc")
					).setValue(vOrc.toString() + vOrcType);
				}
				vFreightDiscount = Number(vFreightDiscount).toFixed(2);
				vPayTermDiscount = Number(vPayTermDiscount).toFixed(2);
				this.byId(
					sap.ui.core.Fragment.createId(
						"idV2FragSumDeatil",
						"idV2InpfraightCost"
					)
				).setValue(vFreightDiscount.toString());
				this.byId(
					sap.ui.core.Fragment.createId(
						"idV2FragSumDeatil",
						"idV2InpPayTermDis"
					)
				).setValue(vPayTermDiscount.toString());
			},

			clearSummary: function () {
				this.byId(
					sap.ui.core.Fragment.createId("idV2FragSumDeatil", "idV2InpInvcDis")
				).setValue("");
				this.byId(
					sap.ui.core.Fragment.createId("idV2FragSumDeatil", "idV2InpOrc")
				).setValue("");
				this.byId(
					sap.ui.core.Fragment.createId(
						"idV2FragSumDeatil",
						"idV2InpfraightCost"
					)
				).setValue("");
				this.byId(
					sap.ui.core.Fragment.createId(
						"idV2FragSumDeatil",
						"idV2InpPayTermDis"
					)
				).setValue("");
			},

			//Start: Upload, View and Download Attachment
			onBeforeUploadStarts: function (oEvent) {

				var that = this;
				this.fileName = oEvent.getParameters().item.getFileName();
				this.fileType = oEvent.getParameters().item.getMediaType();

				var file = oEvent.getParameters().item.getFileObject();

				var reader = new FileReader();
				reader.onload = function (e) {
					var vContent = e.currentTarget.result;
					that.updateFile(that.fileName, that.fileType, vContent);
				};
				reader.readAsDataURL(file);
			},
			updateFile: function (fileName, fileType, vContent) {

				var decodedContent,
					blob,
					vStatus = 1;

				if (fileType === "image/jpeg") {
					decodedContent = atob(
						vContent.split("data:image/jpeg;base64,")[1]
					);
					vStatus = 1;
				} else if (fileType === "image/png") {
					decodedContent = atob(
						vContent.split("data:image/png;base64,")[1]
					);
					vStatus = 1;
				} else if (fileType === "application/pdf") {
					decodedContent = atob(
						vContent.split("data:application/pdf;base64,")[1]
					);
					vStatus = 1;
				} else {
					vStatus = 0;
				}

				// var byteArray = new Uint8Array(decodedContent.length);
				// for (var i = 0; i < decodedContent.length; i++) {
				//   byteArray[i] = decodedContent.charCodeAt(i);
				// }
				// if (fileType === "image/jpeg") {
				//   blob = new Blob([byteArray.buffer], {
				//     type: "image/jpeg",
				//   });
				// } else if (fileType === "image/png") {
				//   blob = new Blob([byteArray.buffer], {
				//     type: "image/png",
				//   });
				// } else if (fileType === "application/pdf") {
				//   blob = new Blob([byteArray.buffer], {
				//     type: "application/pdf",
				//   });
				// }

				// var _url = URL.createObjectURL(blob);
				// jQuery.sap.addUrlWhitelist("blob");
				var fileDetails = {
					Filename: fileName,
					Attachment: vContent,
					Pafno: "",
				};
				// this._fileDetail = fileDetails;

				// this.getView()
				//   .getModel("LocalJSONModelForAttachment")
				//   .getData()
				//   .attachments.Nav_File_Upload.results.push(this._fileDetail);
				// this.getView()
				//   .getModel("LocalJSONModelForAttachment").refresh();

				this.getView().getModel("LocalJSONModelForAttachment").setProperty("/attachments/Nav_File_Upload/results", fileDetails);

			},
			onUploadComplete: function (oEvent) {

				var oFileUploader = oEvent.getSource();
				oFileUploader.getDefaultFileUploader().setValue("")
			},
			onViewAttachmentObjectStatusPress: function (oEvent) {
				var sFile = oEvent
					.getSource()
					.getParent()
					.getProperty("thumbnailUrl"),
					sFileName = oEvent.getSource().getParent().getProperty("fileName"),
					oButton = oEvent.getSource();

				var _imageSrc = { ZRFILE: sFile, ZRFNAME: sFileName };
				var oModelForImage = new sap.ui.model.json.JSONModel(_imageSrc);
				this.getView().setModel(oModelForImage, "oModelForImage");

				if (sFile.includes("PDF") || sFile.includes("pdf")) {
					var fileName = sFileName;

					var decodedContent = atob(
						sFile.split("data:application/pdf;base64,")[1]
					);
					var byteArray = new Uint8Array(decodedContent.length);
					for (var i = 0; i < decodedContent.length; i++) {
						byteArray[i] = decodedContent.charCodeAt(i);
					}
					var blob = new Blob([byteArray.buffer], {
						type: "application/pdf",
					});
					var _pdfurl = URL.createObjectURL(blob);
					jQuery.sap.addUrlWhitelist("blob");
					this.opdfViewer.setSource(_pdfurl);
					this.opdfViewer.setTitle(fileName);
					this.opdfViewer.open();
				} else {
					if (this.oPopover) {
						this.oPopover.destroy();
						delete this._pPopover;
					}

					// create popover for image
					if (!this._pPopover) {
						this._pPopover = Fragment.load({
							id: this.getView().getId(),
							name: "zpj.pro.sk.sd.salesco.zprosalesco.view.fragments.View2.imagePopover",
							controller: this,
						}).then(function (oPopover) {
							return oPopover;
							oPopover.setModel(oModelForImage);
						});
					}
					this._pPopover.then(
						function (oPopover) {
							oPopover.openBy(oButton);

							oPopover.getAggregation("content")[0].setSrc(_imageSrc.ZRFILE);
							this.oPopover = oPopover;
						}.bind(this)
					);
				}
			},
			handleClose: function (oEvent) {
				oEvent.getSource().getParent().getParent().destroy();
			},
			imageDownload: function (oEvent) {
				const sURL = this.getView()
					.getModel("oModelForImage")
					.getData().ZRFILE;
				const imageName = this.getView()
					.getModel("oModelForImage")
					.getData().ZRFNAME;
				fetch(sURL)
					.then((oResponse) => oResponse.blob())
					.then((oBlob) => {
						const sBlobURL = URL.createObjectURL(oBlob);
						const oLink = document.createElement("a");
						oLink.href = sBlobURL;
						oLink.download = imageName;
						oLink.target = "_blank";
						document.body.appendChild(oLink);
						oLink.click();
						document.body.removeChild(oLink);
					});
				oEvent.getSource().getParent().getParent().destroy();
			},
			//End: Upload, View and Download Attachment

			// Start: Upload Excel
			onUpload: function (oEvent) {
				this._importExcel(
					oEvent.getParameter("files") && oEvent.getParameter("files")[0]
				);
			},
			_importExcel: function (file) {
				var that = this;
				var excelData = {};

				if (file && window.FileReader) {
					var reader = new FileReader();
					reader.onload = function (e) {
						var data = e.target.result;
						var workbook = XLSX.read(data, {
							type: "binary",
						});
						workbook.SheetNames.forEach(function (sheetName) {
							// Here is your object for every sheet in workbook
							excelData = XLSX.utils.sheet_to_row_object_array(
								workbook.Sheets[sheetName]
							);
						});

						var tabValues = [];
						var payload = {
							Pafvto: null,
							Kunnr: excelData[0].Customer_Code,
							Pafvfrm: null,
							Ti: "1",
							Gst: "18",
							Name: "",
							Action: "",
							Zterm: excelData[0].Payment_Term,
							Validity: excelData[0].Validity,
							Aufnr: excelData[0].Purchase_Order_No,
							Vtweg: excelData[0].Distribution_Channel,
							Vkbur: excelData[0].Sales_Office,
							Spart: excelData[0].Vertical,
							Oppu: excelData[0].Oppurtunity_ID,
							Specid: excelData[0].Specifier_ID,
							Proj: excelData[0].Project_NameNAddress,
							Spec: excelData[0].Specifier_NameNAddress,
							ET_SALES_COORD_ISET: {
								results: [],
							},
						};
						// Validation to check header titles against uploaded excel
						var excelHeader = [
							"Customer_Code",
							"Payment_Term",
							"Validity",
							"Purchase_Order_No",
							"Distribution_Channel",
							"Sales_Office",
							"Vertical",
							"Oppurtunity_ID",
							"Specifier_ID",
							"Project_NameNAddress",
							"Specifier_NameNAddress",
							"Material_Freight_Group",
							"Design",
							"Supplying_Plant",
							"Manufacturing_Plant",
							"Current_Volume",
							"Total_Volume",
							"Quality",
							"Part",
							"Ex_FACTORYorDEPOT",
							"On_Invoice_Discount",
							"Distribution_Channel",
							"ORC",
							"Freight",
							"Competitor_Name",
							"Competitor_Landed_Price",
							"Remark",
						];

						var val = excelData[0];
						var validExcel = true;

						for (var j in val) {
							var sub_key = j;
							if (excelHeader.includes(sub_key)) {
								validExcel = true;
							} else {
								validExcel = false;
								break;
							}
						}

						if (validExcel) {
							for (var index = 0; index < excelData.length; index++) {
								if (excelData[index].Customer_Code) {
									var i = index.toString();
									var oTab = {};
									oTab.Mfrgr = excelData[i].Material_Freight_Group;
									oTab.Mvgr2 = excelData[i].Design;
									oTab.Werks = excelData[i].Supplying_Plant;
									oTab.Prodh1 = excelData[i].Manufacturing_Plant;
									oTab.CurVolFt = excelData[i].Current_Volume;
									oTab.TotalVol = excelData[i].Total_Volume;
									oTab.Zzprodh4 = excelData[i].Quality;
									oTab.Mvgr5 = excelData[i].Part;

									if (!excelData[i].Ex_FACTORYorDEPOT) {
										oTab.Isexdep = " ";
									} else {
										oTab.Isexdep = excelData[i].Ex_FACTORYorDEPOT;
									}

									oTab.Disc = excelData[i].On_Invoice_Discount;
									if (excelData[0].Distribution_Channel === "15" || excelData[0].Distribution_Channel === "19" || excelData[0].Distribution_Channel === "25" || excelData[0].Distribution_Channel === "29") {
										oTab.Commboxp = excelData[i].ORC;
									} else {
										oTab.Commbox = excelData[i].ORC;
									}
									oTab.Frgtsqft = excelData[i].Freight;
									oTab.Compname = excelData[i].Competitor_Name;
									oTab.Complanprice = excelData[i].Competitor_Landed_Price;
									oTab.Sbremark = excelData[i].Remark;
									payload.ET_SALES_COORD_ISET.results.push(oTab);
								}
							}

							that.getView().getModel("JSONModelPayload").setData(payload);
							that.getView().getModel("JSONModelPayload").refresh(true);

							that.fnResolve();
							that.fireCalls();
						} else {
							MessageBox.error(
								"Uploaded excel has wrong header, Please correct and re-upload"
							);
						}
					};
					reader.onerror = function (ex) {
						sap.m.MessageBox.error(
							"Uploaded excel format is wrong, Please check and reupload"
						);
					};
					reader.readAsBinaryString(file);
				}
			},
			fnResolve: function () {
				// get call - Get Customer Name using customer code
				var sTerm = this.byId(
					sap.ui.core.Fragment.createId(
						"idV2FragGenInfo",
						"idV2InpCustCode"
					)
				).getValue(),
					aFilters = [],
					oFilterDomname = new sap.ui.model.Filter(
						[
							new sap.ui.model.Filter(
								"Domname",
								sap.ui.model.FilterOperator.EQ,
								"KNA1"
							),
						],
						false
					),
					oFilterDomname1 = new sap.ui.model.Filter(
						[
							new sap.ui.model.Filter(
								"Domname1",
								sap.ui.model.FilterOperator.EQ,
								sTerm
							),
						],
						false
					),
					sValue1 = "/Kunnr",
					sValue2 = "/Name",
					sMessage = "Entered Customer code is wrong";
				aFilters.push(oFilterDomname);
				aFilters.push(oFilterDomname1);
				this._submitCall(sTerm, aFilters, sValue1, sValue2, sMessage);
				this.getView().setBusy(true);
				// get call - Get Size using MFG
				const delay = (ms) =>
					new Promise((resolve) => setTimeout(resolve, ms));
				var nLen = this.getView().getModel("JSONModelPayload").getData()
					.ET_SALES_COORD_ISET.results.length;
				[...Array(nLen)].reduce(
					(p, _, index) =>
						p
							.then(() => delay(Math.random() * 1000))
							.then(() => {
								if (index === nLen - 1) {
									this.getView().setBusy(false);
								}
								var bindingContextPath =
									"/ET_SALES_COORD_ISET/results/" + index + "",
									sValue1 = bindingContextPath + "/Mfrgr",
									sValue2 = bindingContextPath + "/Szmm",
									sTerm = this.getView()
										.getModel("JSONModelPayload")
										.getProperty(sValue1),
									aFilters = [],
									Division = this.getView()
										.getModel("JSONModelPayload")
										.getProperty("/Spart"),
									oFilterDomname = new sap.ui.model.Filter(
										[
											new sap.ui.model.Filter(
												"Domname",
												sap.ui.model.FilterOperator.EQ,
												"ZPRICECAT"
											),
										],
										false
									),
									oFilterDomname1 = new sap.ui.model.Filter(
										[
											new sap.ui.model.Filter(
												"Domname1",
												sap.ui.model.FilterOperator.EQ,
												sTerm
											),
										],
										false
									),
									oFilterDomname2 = new sap.ui.model.Filter(
										[
											new sap.ui.model.Filter(
												"Domname2",
												sap.ui.model.FilterOperator.EQ,
												Division
											),
										],
										false
									),
									sMessage = "Entered Material Freight Group is wrong";
								aFilters.push(oFilterDomname);
								aFilters.push(oFilterDomname1);
								aFilters.push(oFilterDomname2);

								if (Division) {
									this._submitCall(
										sTerm,
										aFilters,
										sValue1,
										sValue2,
										sMessage
									);
									this.byId(
										sap.ui.core.Fragment.createId(
											"idV2FragGenInfo",
											"idV2SLVertical"
										)
									).setValueState("None");
								} else {
									MessageBox.error("Please select vertical first");
									this.getView()
										.getModel("JSONModelPayload")
										.setProperty(sValue1, "");
									this.getView()
										.getModel("JSONModelPayload")
										.setProperty(sValue2, "");
									this.byId(
										sap.ui.core.Fragment.createId(
											"idV2FragGenInfo",
											"idV2SLVertical"
										)
									).setValueState("Error");
								}
							}),
					Promise.resolve()
				);
			},

			fireCalls: function () {
				validation.headerPayloadValidation(this);
				var aData = this.getView().getModel("JSONModelPayload").getData()
					.ET_SALES_COORD_ISET.results;
				validation.itemsPayloadValidation(aData, this, "Proceed");

				// this.byId(sap.ui.core.Fragment.createId("idV2FragGenInfo", "idV2SLDistChannel")).fireChange();
				// this.byId(sap.ui.core.Fragment.createId("idV2FragGenInfo", "idV2InpSalesOffice")).fireSubmit();
				// var aTableItems = this.byId(sap.ui.core.Fragment.createId("idV2FragGenInfo", "idV2TblProducts")).getBinding('items');
				var Vtweg = this.getView()
					.getModel("JSONModelPayload")
					.getProperty("/Vtweg");
				if (Vtweg === "15" || Vtweg === "19" || Vtweg === "25" || Vtweg === "29") {
					this.byId(
						sap.ui.core.Fragment.createId("idV2FragGenInfo", "idV2LblPayTerm")
					).setRequired(true);
					this.byId(
						sap.ui.core.Fragment.createId(
							"idV2FragGenInfo",
							"idV2SLPaymentTerm"
						)
					).setEnabled(true);
				} else {
					this.byId(
						sap.ui.core.Fragment.createId("idV2FragGenInfo", "idV2LblPayTerm")
					).setRequired(false);
					this.byId(
						sap.ui.core.Fragment.createId(
							"idV2FragGenInfo",
							"idV2SLPaymentTerm"
						)
					).setEnabled(false);
				}
			},
			_submitCall: function (sTerm, aFilters, sValue1, sValue2, sMessage) {
				if (sTerm) {
					var sPath = "/ET_VALUE_HELPSSet";

					this.getView().getModel().read(sPath, {
						filters: aFilters,
						success: function (Data) {
							if (Data.results.length === 1) {

								if (sValue1.includes("Mvgr2")) {
									this.getView().getModel("JSONModelPayload").setProperty(sValue1, Data.results[0].Ddtext);
								} else {
									this.getView().getModel("JSONModelPayload").setProperty(sValue1, Data.results[0].DomvalueL);
								}

								if (sValue2) {
									this.getView().getModel("JSONModelPayload").setProperty(sValue2, Data.results[0].Ddtext);
								}
							} else {
								this.getView().getModel("JSONModelPayload").setProperty(sValue1, "");
								if (sValue2) {
									this.getView().getModel("JSONModelPayload").setProperty(sValue2, "");
								}

								if (this.vTemp === 1) {
									// Come back here
									this.vTemp += 1;
									MessageBox.error(sMessage);
								}
							}
						}.bind(this),
						error: function (sError) {
							this.getView().setBusy(false);
							// var sErrorMessage = JSON.parse(oError.responseText).error.innererror.errordetails[0].message;
							if (this.vTemp === 1) {
								// Come back here
								this.vTemp += 1;
								var sErrorMessage =
									"Something went wrong, Please check and try again with correct data";

								if (sErrorMessage) {
									MessageBox.error(sErrorMessage, {
										actions: [sap.m.MessageBox.Action.OK],
										onClose: function (oAction) {
											// window.location.reload();
										},
									});
								}
								// else {
								//   MessageBox.error("Something went wrong, Please refresh browser and try again", {
								//     actions: [sap.m.MessageBox.Action.OK],
								//     onClose: function (oAction) {},
								//   });
								// }
							}
						}.bind(this),
					});
				}
			},


			// End: Upload Excel

			//Start: Upload Excel - File Uploader
			handleUploadComplete: function (oEvent) {
				// Please note that the event response should be taken from the event parameters but for our test example, it is hardcoded.

				var sResponse = "File upload complete. Status: 200",
					iHttpStatusCode = parseInt(/\d{3}/.exec(sResponse)[0]),
					sMessage;

				if (sResponse) {
					sMessage = iHttpStatusCode === 200 ? sResponse + " (Upload Success)" : sResponse + " (Upload Error)";
					MessageToast.show(sMessage);
				}
			},

			handleUploadPress: function () {
				var oFileUploader = this.getView().byId("fileUploader");;
				oFileUploader.checkFileReadable().then(function () {
					oFileUploader.upload();
				}, function (error) {
					MessageToast.show("The file cannot be read. It may have changed.");
				}).then(function () {
					oFileUploader.clear();
				});
			},
			//End: Upload Excel - File Uploader

			// Start: Download Excel
			//Excel export using Spreadsheet
			onExport: function () {
				var aCols, oRowBinding, oSettings, oSheet, oTable;

				if (!this._oTable) {
					this._oTable = this.byId(
						sap.ui.core.Fragment.createId(
							"idV2FragAddPrdDetails",
							"idV2TblProducts"
						)
					);
				}

				oTable = this._oTable;
				oRowBinding = oTable.getBinding("items");
				aCols = this.createColumnConfig();

				oSettings = {
					workbook: {
						columns: aCols,
						hierarchyLevel: "Level",
						textAlign: "Left",
						wrap: true,
						context: {
							sheetName: "Product Details",
						},
					},
					dataSource: oRowBinding,
					count: 0,
					fileName: "Product Details.xlsx",
					worker: false, // We need to disable worker because we are using a MockServer as OData Service
				};

				oSheet = new Spreadsheet(oSettings);
				oSheet.build().finally(function () {
					oSheet.destroy();
				});
			},
			createColumnConfig: function () {
				var aCols = [];
				aCols.push({
					property: "CustomerCode",
					type: EdmType.String,
				});
				aCols.push({
					property: "DistributionChannel",
					type: EdmType.String,
				});
				aCols.push({
					property: "PaymentTerm",
					type: EdmType.String,
				});
				aCols.push({
					property: "ValidityInDays",
					type: EdmType.String,
				});
				aCols.push({
					property: "PurchaseOrderNo",
					type: EdmType.String,
				});
				aCols.push({
					property: "SalesOffice",
					type: EdmType.String,
				});
				aCols.push({
					property: "Vertical",
					type: EdmType.String,
				});

				aCols.push({
					property: "MaterialFreightGroup",
					type: EdmType.String,
				});

				aCols.push({
					property: "Design",
					type: EdmType.String,
				});

				aCols.push({
					property: "SupplyingPlant",
					type: EdmType.String,
				});

				aCols.push({
					property: "ManufacturingPlant",
					type: EdmType.String,
				});
				aCols.push({
					property: "CurrentVolumeInSqft",
					type: EdmType.String,
				});
				aCols.push({
					property: "TotalVolumeInSqft",
					type: EdmType.Number,
				});

				aCols.push({
					property: "Quality",
					type: EdmType.Number,
				});

				aCols.push({
					property: "OnInvoiceDiscount",
					type: EdmType.Number,
				});

				aCols.push({
					property: "ORCByBox",
					type: EdmType.Number,
				});

				aCols.push({
					property: "ORCInPer",
					type: EdmType.Number,
				});

				aCols.push({
					property: "FreightInSqFt",
					type: EdmType.Number,
				});

				aCols.push({
					property: "CompetitorName",
					type: EdmType.Number,
				});

				aCols.push({
					property: "CompetitorLandedPrice",
					type: EdmType.Number,
				});
				aCols.push({
					property: "PartAorB",
					type: EdmType.Number,
				});
				aCols.push({
					property: "Sbremark",
					type: EdmType.String,
				});

				return aCols;
			},
			// End: Download Excel




			// Start: newUploader001 

			// Attachment
			handleUploadChange: function (e) {
				var aFiles = e.getParameter("files");
				for (var i = 0; i < aFiles.length; i++) {
					this._import(aFiles[i]);
				}
				e.getSource().setValue("");
			},

			// Attachment
			handleDownloadPress: function (oEvent) {
				var iIndex = oEvent.getSource().getId().split("-")[2];
				//   fContent = atob(this.getView().getModel("oDOAAAttachmentModel").getData()[iIndex].Attachment),
				//   byteNumbers = new Array(fContent.length),
				//   fileName = this.getView().getModel("oDOAAAttachmentModel").getData()[iIndex].Filename,
				//   fileType = this.getView().getModel("oDOAAAttachmentModel").getData()[iIndex].Mimetype;
				// for (var i = 0; i < fContent.length; i++) {
				//   byteNumbers[i] = fContent.charCodeAt(i);
				// }
				// var fileExtension = fileName.split('.').pop();
				// var fileNameExtract = fileName.split(".")[0];
				// var byteArray = new Uint8Array(byteNumbers),
				//   blob = new Blob([byteArray], { type: fileType });
				// if (blob) {
				//   File.save(blob, fileNameExtract, fileExtension, fileType);
				// } else {
				//   console.error("File type not supported:", fileExtension);
				// }

				var sFile = this.getView().getModel("oDOAAAttachmentModel").getData()[iIndex].Attachment,
					sFileName = this.getView().getModel("oDOAAAttachmentModel").getData()[iIndex].Filename,
					//oButton = oEvent.getSource();

					fContent = atob(sFile),
					byteNumbers = new Array(fContent.length),
					fileExtension = sFileName.split('.').pop();
				var fileType = this.getFileType(fileExtension);
				for (var i = 0; i < fContent.length; i++) {
					byteNumbers[i] = fContent.charCodeAt(i);
				}

				const byteArray = new Uint8Array(byteNumbers);
				const blob = new Blob([byteArray], { type: fileType });

				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = "AttachFile." + fileExtension; //"file.pdf";
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);

			},

			//Download Attachment
			getFileType: function (sVal) {
				//var sfileType = "application/pdf";
				if (sVal === "PNG" || sVal === "png") {
					return "image/png";
				} else if (sVal === "JPEG" || sVal === "jpeg") {
					return "image/jpeg";
				} else if (sVal === "PLAIN" || sVal === "plain") {
					return "text/plain";
				} else if (sVal === "xlsx" || sVal === "msexcel") {
					return "application/vnd.ms-excel";
				} else {
					return "application/pdf";
				}
			},

			removeAttachment: function (oEvent) {
				var oAttachmentModel = this.getView().getModel("oDOAAAttachmentModel");
				var sFileName = oEvent.getSource().getBindingContext("oDOAAAttachmentModel").getProperty("Filename");
				var arrFile = oAttachmentModel.getData();
				var updatedArrFile = arrFile.filter(function (attachment) {
					return attachment.Filename !== sFileName;
				});
				oAttachmentModel.setData(updatedArrFile);
				oAttachmentModel.refresh();
			},


			// Attachment
			_import: function (file) {
				var that = this;
				if (file && window.FileReader) {
					var reader = new FileReader();
					var fileName = file.name;
					// var Mimetype = file.type;
					reader.onload = function (e) {
						var arrFile = this.getView().getModel("oDOAAAttachmentModel").getData();
						const data = e.target.result;
						var newAttachObj = {
							Attachment: btoa(data),
							Filename: fileName
						};
						arrFile.push(newAttachObj);
						that.getView().getModel("oDOAAAttachmentModel").setData(arrFile);
						that.getView().getModel("oDOAAAttachmentModel").refresh();
						// that.onSaveDraftAttachment(arrFile[0].DoaNum);
					}.bind(this);
					reader.onerror = function (ex) {
						console.log(ex);
						that.getView().setBusy(false);
					};
					reader.readAsBinaryString(file);
				}
			},
			// End: newUploader001
		}
		);
	}
);
