/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

 define(['N/ui/serverWidget', 'N/runtime', 'N/search'], function (serverWidget,runtime,search) {
    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Simple Form'
            });

            var scriptObj = runtime.getCurrentScript();
            var mySearchId =  scriptObj.getParameter({name: 'custscript_saved_search'});
            var mySearch = search.load({
                id: mySearchId
            });
           
           
           // form.clientScriptFileId = scriptObj.getParameter({name: 'custscript_script_id_module'});
            var withResults = false;
            var content = '';
            mySearch.run().each(function (result) {
                var columns = result.columns;
                var docNumber = result.getValue(result.columns[0]);
                content = '<button id="mark-all" onclick="markAll();" type="button" class="btn btn-primary">Mark all</button>';
    
                content += '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous"><table class="table table-dark"><thead><tr>';
                content += '<th scope="col">Purchase Order#</th>';
                for (var i = 0; i < columns.length; i++) {
                    content += "<th scope='col'>"+columns[i].label+"</th>";
                }
                content += '<th scope="col">Approve</th>';
                content += '</tr></thead>';
                log.debug("result", result);
                content += '<tbody><tr>';
                content += '<th scope="row">'+docNumber+'</th>';
                for (var i = 0; i < columns.length; i++) {
                    var value = result.getText(result.columns[i]);
                    if(!value) {
                        value = result.getValue(result.columns[i]);
                    }
                    content += '<th scope="row">'+value+'</th>';
                    log.debug("value", value);
                }
                content += '<td><input name="po_orders" id="po_order_'+result.id+'" type="checkbox"></td>';
                content += '</tr></tbody>';
                withResults = true;
                return true;
            });
            content+='</tbody></table><button type="button" onclick="submitPos();" id="submit" class="btn btn-primary">Submit</button>'
           

            var htmlField = form.addField({
                id: 'custpage_selectfield',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Po to approve'
            });

            log.debug("content: ", content)
            htmlField.defaultValue = content;
            context.response.writePage(form);
        } 
    }

    return {
        onRequest: onRequest
    };
});