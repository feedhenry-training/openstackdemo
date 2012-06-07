$fh.ready(function() {
   $fh.legacy.fh_timeout = 500000;
   function takePicture() {
    $("#camera").attr("disabled", "disabled");
    var savedButtonText = $("#camera").html(); 
    $("#camera").html("Uploading...");
    navigator.camera.getPicture(function(imageData) {
      $fh.act({
        "act": "postPicture",
        "req": {
          "data": imageData,
          "ts": new Date().getTime()
        }
      }, function(res) {
        // Cloud call was successful. Alert the response
        $("#camera").html(savedButtonText);
        $("#camera").removeAttr("disabled");
        alert('Image sent.');
        listPictures();
      }, function(msg, err) {
        // An error occured during the cloud call. Alert some debugging information
        $("#camera").html(savedButtonText);
        $("#camera").removeAttr("disabled");
        alert('Cloud call failed with error:' + msg + '. Error properties:' + JSON.stringify(err));
        listPictures();
      });

    }, function() {
      //error
    }, {
      quality: 10,
      targetWidth: 150,
      targetHeight: 150
    });
  };

  function listPictures() {
    $fh.act({
      "act": "getList",
    }, function(res) {
      $('#picture_list').empty();
      $.each(res.files, function(i, fileName) {
        console.log("Appending to picture list: " + '<li id="file_' + fileName + '">File Name: ' + fileName + '</li>');
        $('#picture_list').append('<li data-file-name="' + fileName + '">File Name: ' + fileName + '</li>');
      });
    }, function(msg, err) {
      alert('Cloud call failed with error:' + msg + '. Error properties:' + JSON.stringify(err));
    });
  };


  $('#picture_list').delegate('li', 'click', function() {
    var fileName = $(this).attr("data-file-name");
    $('#images').empty();
    $fh.act({
      "act": "getImageData",
      "req": {
        fileName: fileName
      }
    }, function(res) {
      var img = new Image();
      img.src = "data:image/jpeg;base64," + res.imageData;
      $('#images').append(img);
    }, function(msg, err) {
      alert('Cloud call failed with error:' + msg + '. Error properties:' + JSON.stringify(err));
    });
  });

  $('#camera').click(function() {
    takePicture();
  });

  $('#refresh').click(function() {
    listPictures();
  });

});