$(document).ready(function(){

    $('#submit').click(function(){
        var data = {'hName': $('#hName').val()};
        data = JSON.stringify(data);

        $.ajax({
            type: 'POST',
            url: '/findFile',
            data: data,
            success: function(res){
                alert($('#hName').val() + ' is downloaded');
            },
            contentType: "application/json",
          });
    });

});