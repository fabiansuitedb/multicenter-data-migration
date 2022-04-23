/**
 * @NApiVersion 2.1
 * @Version 1.0
 * @NScriptType UserEventScript
	Date                Author                                                 Remarks
26 November     2021 Diego Lemos <diego@suitedb.com>             Makes a http call to WMS depending on the record type
*/

define(["exports", "N/log", "N/runtime", "N/file", "N/https", "N/record"], function (
	exports,
	log,
	runtime,
	file,
    https, 
    record
) {
	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.afterSubmit = void 0;

    const myMapper = {"NSTransactions": {
        "salesorder":{
            "bodyfields": {
                "location": {
                    "type": "text",
                    "xmlField": ["{sdb_location}"]
                },
                "tranid": {
                    "type": "value",
                    "xmlField": ["{sdb_tranid}"]
                },
                "trandate": {
                    "type": "value",
                    "xmlField": ["{sdb_trandate}"]
                }
                ,"shipdate": {
                    "type": "value",
                    "xmlField": ["{sdb_shipdate}", "{sdb_cust_date_1}"]
                }
                ,"entity": {
                    "type": "value",
                    "xmlField": ["{sdb_entity}"]
                }
            },
            "lines": {
                "items":
                    {
                        "field1": {
                            "type": "type",
                            "xmlField": "xmlFieldName"
                        },
                        "field2": {
                            "type": "type",
                            "xmlField": "xmlFieldName"
                        }
                    }
            }
        },
        "PO":{
            "bodyfields": {
                "field1": {
                    "type": "type",
                    "xmlField": "xmlFieldName"
                },
                "field2": {
                    "type": "type",
                    "xmlField": "xmlFieldName"
                }
            },
            "lines": {
                "items":
                    {
                        "field1": {
                            "type": "type",
                            "xmlField": "xmlFieldName"
                        },
                        "field2": {
                            "type": "type",
                            "xmlField": "xmlFieldName"
                        }
                    }
            }
        }
    },
    "transactionType":{
        "order-REPTDA": {
            "fieldToHardcode": "value"
        }
    }
}

	const afterSubmit = (context) => {
		try {
            
			//variable declarations
			const thisRecord = context.newRecord;
			const xmlMapperData = runtime.getCurrentScript().getParameter({ name: "custscript_recordtype_mapper" });
            const xmlMapper = JSON.parse(xmlMapperData);
			const xmlID = xmlMapper[thisRecord.type];
            let xmlText;

            

               
			// let urlRequest = "https://ta4.wms.ocs.oraclecloud.com/multicenter_test/wms/api/init_stage_interface/";
			// let headerRequest = {
			// 	'Authorization': "Basic " + getAuthCode(),
			// 	'Content-Type': 'application/x-www-form-urlencoded',
            //     'Accept': '*/*'
			// }
			// let objResponse = {};
         
			//If the record type is valid (it's mapped in the script parameter)
			if (xmlID) {
				//get the XML from the file cabinet
				log.debug('xmlID:  ',  xmlID);
				xmlText = file.load(xmlID).getContents();
				log.debug("xmlText", xmlText);

                let xmlResponse = getXMLString(xmlText, thisRecord.id, thisRecord.type, myMapper);
				//Replace xml tempplate fields with the actual SO data
                
				const myFields = thisRecord.getFields(); 
				myFields.forEach((field) => {
					let fieldText = String(thisRecord.getText(field));
					xmlText = xmlText.replace("{sdb_" + field + "}", fieldText);
				});
				log.debug("xmlResult", xmlText);

				//HTTP call
				
               /* let objResponse = https.post({
                    body: '&async=0&xml_data='+xmlText,
                    url: urlRequest,
                    headers: headerRequest
                });
				log.debug('response: teststtsts  ', objResponse.body); */
			}

		} catch (error) {
			log.debug("error", error);
		}
	};
	
	

	//Auxiliar Functions
    function getXMLString(xmlTemplate, recordId, recordType, mapperJSON){
        let stringResponse = xmlTemplate;
        try{
            let transactionRecord = record.load({
                type: recordType,
                id: recordId
            });
            if(mapperJSON.NSTransactions[recordType]){
                //get all body fields
                let bodyFieldsObj = mapperJSON.NSTransactions[recordType].bodyfields;
                Object.keys(bodyFieldsObj).forEach(function (field) {
                    let fieldText;
                    //check for type getValue or getText
                    if(bodyFieldsObj[field].type === "text"){
                        fieldText = transactionRecord.getText(field);
                    } else{
                        fieldText = transactionRecord.getValue(field);
                    }
                    //check for field to override
                    if(bodyFieldsObj[field].xmlField.length === 1){
                        stringResponse = stringResponse.replace(bodyFieldsObj[field].xmlField[0], fieldText);
                    } else if(bodyFieldsObj[field].xmlField.length > 1){
                        bodyFieldsObj[field].xmlField.forEach(function(fieldToOverride){
                            stringResponse = stringResponse.replace(fieldToOverride, fieldText);
                        });
                    }
                });

                //TODO the same with items.
                //get lineitemcount del record con los items, y a partir de ahi iterar. 
                //TODO use record as parameter
                //TODO the hardcoded stuff in mapperJSON.transactionType

                
            }
        } catch(e){
            log.error('error in getXMLString', e.message);
        }
        log.debug('string response let me see', stringResponse);
        return stringResponse;
    }

	function getAuthCode() {

        var Base64 = { _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", encode: function (e) { var t = ""; var n, r, i, s, o, u, a; var f = 0; e = Base64._utf8_encode(e); while (f < e.length) { n = e.charCodeAt(f++); r = e.charCodeAt(f++); i = e.charCodeAt(f++); s = n >> 2; o = (n & 3) << 4 | r >> 4; u = (r & 15) << 2 | i >> 6; a = i & 63; if (isNaN(r)) { u = a = 64 } else if (isNaN(i)) { a = 64 } t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a) } return t }, decode: function (e) { var t = ""; var n, r, i; var s, o, u, a; var f = 0; e = e.replace(/[^A-Za-z0-9+/=]/g, ""); while (f < e.length) { s = this._keyStr.indexOf(e.charAt(f++)); o = this._keyStr.indexOf(e.charAt(f++)); u = this._keyStr.indexOf(e.charAt(f++)); a = this._keyStr.indexOf(e.charAt(f++)); n = s << 2 | o >> 4; r = (o & 15) << 4 | u >> 2; i = (u & 3) << 6 | a; t = t + String.fromCharCode(n); if (u != 64) { t = t + String.fromCharCode(r) } if (a != 64) { t = t + String.fromCharCode(i) } } t = Base64._utf8_decode(t); return t }, _utf8_encode: function (e) { e = e.replace(/rn/g, "n"); var t = ""; for (var n = 0; n < e.length; n++) { var r = e.charCodeAt(n); if (r < 128) { t += String.fromCharCode(r) } else if (r > 127 && r < 2048) { t += String.fromCharCode(r >> 6 | 192); t += String.fromCharCode(r & 63 | 128) } else { t += String.fromCharCode(r >> 12 | 224); t += String.fromCharCode(r >> 6 & 63 | 128); t += String.fromCharCode(r & 63 | 128) } } return t }, _utf8_decode: function (e) { var t = ""; var n = 0; var r = c1 = c2 = 0; while (n < e.length) { r = e.charCodeAt(n); if (r < 128) { t += String.fromCharCode(r); n++ } else if (r > 191 && r < 224) { c2 = e.charCodeAt(n + 1); t += String.fromCharCode((r & 31) << 6 | c2 & 63); n += 2 } else { c2 = e.charCodeAt(n + 1); c3 = e.charCodeAt(n + 2); t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63); n += 3 } } return t } }


        var string = 'rest_mc' + ':' + 'R3stmC2021'
        // Encode the String
        var encodedString = Base64.encode(string);

        return encodedString;
    }
	exports.afterSubmit = afterSubmit;
});