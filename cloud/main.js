var fs = require('fs');
var async = require('async');
var buffertools = require('buffertools');
var openstack_storage = require('openstack-storage');

var config = {
  "auth": {
    "passwordCredentials": {
      "username": "admin",
      "password":"4133851b857c3100048c"
    },
    "tenantId": "cf44cc86f0dc4c6b9903400e52940d10"
  },
  "host": "http://ec2-79-125-126-243.eu-west-1.compute.amazonaws.com.:5000",
  "storageName": "Swift Service"
};

var authFn = async.apply(openstack_storage.authenticate, config);

exports.postPicture = function(params, callback) {
  console.log('in postPicture with ts:' + Date.now());
  var photoData = params.data;
  var fileName = "photo_" + params.ts + ".jpg";
  var localName = "/tmp/" + fileName;
  var storage = new openstack_storage.OpenStackStorage (authFn, function(err, res, tokens) {
    console.log("constructor - err: ", err, ", tokens: ", tokens);
    if (err) return callback(err);
    var decodedImage = new Buffer(photoData, 'base64');
    fs.writeFileSync(localName, decodedImage);
    storage.createContainer("Photos", function (err, statusCode) {
      console.log("createContainer - err: ", err, ", statusCode: ", statusCode);
      if (err) return callback(err, statusCode);
      storage.putFile("Photos", {remoteName: fileName, localFile: localName}, function (err, statusCode) {
        console.log("putFile - err: ", err, ", statusCode: ", statusCode);
        return callback(err, statusCode);
      });
    });
  });
};

exports.getList = function(params, callback) {
  var fileList = [];

  var storage = new openstack_storage.OpenStackStorage (authFn, function(err, res, tokens) {
    if (err) return callback(err);
    storage.getFiles("Photos", function (err, files) {
      if (err) {
        return callback(err);
      }
      async.forEachSeries(
        files,
        function (file, fileCallback) {
          console.log("found file: ", file.name);
          fileList.push(file.name);
          fileCallback();
        },
        function (err) {
          callback(null, {files: fileList});
        }
      );
    });
  });
};


exports.getImageData = function(params, callback) {
  var storage = new openstack_storage.OpenStackStorage (authFn, function(err, res, tokens) {
    if (err) return callback(err);
    var receiverStream = new buffertools.WritableBufferStream();
    storage.getFile("Photos", {remoteName: params.fileName, stream: receiverStream}, function (err, statusCode) {
      if (err) {
        return callback(err);
      }
      return callback(err, {imageData: receiverStream.getBuffer().toString('base64')});
    });
  });
};


