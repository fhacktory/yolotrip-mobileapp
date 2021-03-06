var Q = require('q');

/**
 * 
 */
exports.getPhoto = function(photoSource) {
  var deferred = Q.defer();

  Ti.API.debug('Ti.Media.isCameraSupported ' + Ti.Media.isCameraSupported);

  /*
  if (!Ti.Media.isCameraSupported && photoSource == 'showCamera') {
      photoSource = 'openPhotoGallery';
  } else if (!photoSource) {
      photoSource = 'showCamera';
  }
  */
  
  if (photoSource != 'showCamera' && photoSource != 'openPhotoGallery') {
      throw('Unsuported photo source '+photoSource);
  }

  Titanium.Media[photoSource]({
    success : function(event) {
      // event.media
      Ti.API.info('Got a photo !');
      
      deferred.resolve({
        success : true,
        media : event.media
      });
    },
    cancel : function() {
      // called when user cancels taking a picture
      deferred.reject({
        success : false,
        msg : 'User Cancelled'
      });
    },
    error : function(error) {
      // display alert on error
      var msg = "";
      if (error.code == Titanium.Media.NO_CAMERA) {
        msg = 'Please run this test on device';
      } else {
        msg = 'Unexpected error: ' + error.code;
      }
      alert(msg);
      
      deferred.reject({
        error : error,
        msg : msg
      });
    },
    saveToPhotoGallery : false,
    allowEditing : true,
    // only allow for photos, no video
    mediaTypes : [Ti.Media.MEDIA_TYPE_PHOTO]
  });

  return deferred.promise;

};
