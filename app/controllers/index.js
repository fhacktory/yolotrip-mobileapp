require('ti.parse_mine')(Alloy.CFG.parseOptions);
var win = $.index;
var width = win.width;
var height = win.height;

// Test resize
/*
require('cameraService').getPhoto().then(function(_response) {

}, function(_error) {
    Ti.API.info(_error);
    alert(_error.msg);
});
*/
    
$.takePhoto.addEventListener('click', function(e) {
    require('cameraService').getPhoto().then(function(_response) {
        try {
            var imageFactory = require('ti.imagefactory');
            var imageBlob = _response.media;
            var smallImage = null;
            var heightOfImage = imageBlob.height;  
            var widthOfImage = imageBlob.width;
            var aspectRatio =  heightOfImage / widthOfImage;
            
            if (widthOfImage > 640) {
                var newWidth = 640;
                var newHieght = newWidth*aspectRatio;
                
                Ti.API.info('Resizing image from ' + widthOfImage + ', ' + heightOfImage + ' to ' + newWidth + ', ' + newHieght);
                
                var smallImage = imageFactory.imageAsResized(imageBlob, {
                        width: newWidth,
                        height: newHieght,
                        quality: imageFactory.QUALITY_MEDIUM
                });
            }
            
            return require('photoService').savePhoto({
                media : smallImage ? smallImage : imageBlob
            });
        } catch (e) {
            Ti.API.info(e);
        }
    }).then(function(_saveResult) {
      Ti.API.info(JSON.stringify(_saveResult, null, 2));
      alert('Image uploaded');
    }, function(_error) {
        Ti.API.info(_error);
        alert(_error.msg);
    });
});

$.openMap.addEventListener('click', function(e) {
    alert('Hello');
});

$.index.open();