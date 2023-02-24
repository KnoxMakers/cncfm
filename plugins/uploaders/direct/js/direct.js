class cncfmUploader_direct {
  config = {};

  constructor(config) {
    this.config = config;
  }

  activate(f) {
    cncfm.uploaders.upload({});
  }
};
