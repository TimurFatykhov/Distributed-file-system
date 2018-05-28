$(document).ready(function(){

    $('#submit').click(function(){
        var hName = $('#hName').val();
        var data = {'hName': hName};
        data = JSON.stringify(data);

        $.ajax({
            type: 'POST',
            url: '/findFile',
            data: data,
            success: function(res){
                res = JSON.parse(res);
                if(res.hName == hName)
                    alert(hName + ' is downloaded');
                else
                    alert(hName + " isn't downloaded");
            },
            contentType: "application/json",
          });
    });

});