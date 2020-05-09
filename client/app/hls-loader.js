// special playlist post processing function
function process(playlist) {
  return playlist;
}

class fLoader extends Hls.DefaultConfig.loader {

  constructor(config) {
    console.log("nemtom");
    super(config);
    var load = this.load.bind(this);
    this.load = function(context, config, callbacks) {
        var onSuccess = callbacks.onSuccess;
        callbacks.onSuccess = function(response, stats, context) {
          response.data = process(response.data);
          onSuccess(response, stats, context);
        };
      load(context,config,callbacks);
    };
  }
}

module.exports.fLoader = fLoader;
