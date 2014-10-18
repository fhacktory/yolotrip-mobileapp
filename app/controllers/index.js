 require('ti.parse_mine')(Alloy.CFG.parseOptions);
 
// Login
var defaultUser = {
    username: 'Chupee',
    password: 'fhacktory'
};
$.login = Alloy.createWidget('com.appcelerator.login');
$.login.usernameTxt.value = defaultUser.username;
$.login.passwordTxt.value = defaultUser.password;
$.login.init({
    loginCallback: function(credentials) {
        // Try user login
        Parse.User.logIn(credentials.username, credentials.password,
            {
                success: function(user) {
                    Ti.API.info('User connected');
                    $.login.close();
                    showMainScreen();
                },
                error: function(user, error) {
                    alert("Unable to log in: " + error.code + " " + error.message);
                }
            }
        );
    }
});
$.login.open();

// Main screen
var showMainScreen = function() {
    var win = $.index;
    var width = win.width;
    var height = win.height;
    
    // Take photo
    $.takePhoto.addEventListener('click', function(e) {
        require('cameraService').getPhoto().then(function(_response) {
            try {
                var imageBlob = _response.media;
                var smallImage = null;
                var heightOfImage = imageBlob.height;  
                var widthOfImage = imageBlob.width;
                var aspectRatio =  heightOfImage / widthOfImage;
                
                if (widthOfImage > 640) {
                    var newWidth = 640;
                    var newHeight = newWidth*aspectRatio;
                    
                    Ti.API.info('Resizing image from ' + widthOfImage + ', ' + heightOfImage + ' to ' + newWidth + ', ' + newHeight);
                    smallImage = imageBlob.imageAsResized(newWidth, newHeight);
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
        });
    });
    
    $.openMap.addEventListener('click', function(e) {
        var mapController = Alloy.createController('map').getView();
        mapController.open({modal:true});
    });
    
    $.index.open();
};