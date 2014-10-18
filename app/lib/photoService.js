var Q = require('q');

/**
 * 
 * @param {String} _options.fileName
 * @param {TiBlob} _options.media
 */
exports.savePhoto = function(_options) {
  var photoSource;
  var deferred = Q.defer();
  var b64 = Titanium.Utils.base64encode(_options.media);

  var file = new Parse.File(_options.fileName || "photo.jpg", {
    base64 : b64.getText()
  });

  file.save().then(function(_result) {
    // The file has been saved to Parse.
    var photo = new Parse.Object("Photo");
    photo.set("file", file);
    if (_options.location) {
        photo.relation('location').add(_options.location);
        Ti.App.fireEvent('app:uploadingPhoto', {location: _options.location});
    }
    
    return photo.save();
  }).then(function(_result2) {
    deferred.resolve({
      success : true,
      model : _result2
    });
  }, function(error) {
    // The file either could not be read, or could not be saved to Parse.
    alert("Error: " + error.code + " " + error.message);
    Ti.API.info(JSON.stringify(error, null, 2));
    deferred.reject({
      error : error,
      msg : msg
    });
  });

  return deferred.promise;

};
