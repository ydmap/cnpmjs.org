'use strict';

var mkdirp = require('mkdirp');
var copy = require('copy-to');
var path = require('path');
var fs = require('fs');
var os = require('os');
var utility = require('utility');

var version = require('../package.json').version;

var root = path.dirname(__dirname);
var dataDir = path.join(root, '../.cnpmjs.org');

var config = {
  version: version,
  dataDir: dataDir,

  /**
   * Cluster mode
   */
  enableCluster: false,
  numCPUs: os.cpus().length,

  /*
   * server configure
   */

  registryPort: 7001,
  webPort: 7002,
  bindingHost: '127.0.0.1', // only binding on 127.0.0.1 for local access
  // default is ctx.protocol
  protocol: '',

  // debug mode
  // if in debug mode, some middleware like limit wont load
  // logger module will print to stdout
  debug: process.env.NODE_ENV === 'development',
  // page mode, enable on development env
  pagemock: process.env.NODE_ENV === 'development',
  // session secret
  sessionSecret: 'cnpmjs.org test session secret',
  // max request json body size
  jsonLimit: '10mb',
  // log dir name
  logdir: path.join(dataDir, 'logs'),
  // update file template dir
  uploadDir: path.join(dataDir, 'downloads'),
  // web page viewCache
  viewCache: false,

  // registry http response cache control header
  // if you are using CDN, can set it to 'max-age=0, s-maxage=10, must-revalidate'
  // it meaning cache 10s on CDN server and no cache on client side.
  registryCacheControlHeader: '',
  // if you are using CDN, can set it to 'Accept, Accept-Encoding'
  registryVaryHeader: '',
  // disable package search
  disableSearch: false,

  // view files directory
  viewDir: path.join(root, 'view', 'web'),

  customRegistryMiddlewares: [],

  // config for koa-limit middleware
  // for limit download rates
  limit: {
    enable: false,
    token: 'koa-limit:download',
    limit: 1000,
    interval: 1000 * 60 * 60 * 24,
    whiteList: [],
    blackList: [],
    message: 'request frequency limited, any question, please contact dev@ydmap.cn',
  },

  enableCompress: false, // enable gzip response or not

  // default system admins
  admins: {
    // name: email
    admin: 'dev@ydmap.cn',
  },

  // email notification for errors
  // check https://github.com/andris9/Nodemailer for more informations
  mail: {
    enable: true,
    appname: 'npm mirror',
    from: 'npm mirror mail sender <dev@ydmap.cn>',
    host: 'smtp.exmail.qq.com', // 这是腾讯的邮箱 host
    port: 465, // smtp 端口
    secure: true,
    auth: {
      user: 'dev@ydmap.cn', // 发送邮件的邮箱名
      pass: '385dciEypL8xVUx7', // 邮箱的授权码，也可以使用邮箱登陆密码
    },
  },

  logoURL: 'https://os.alipayobjects.com/rmsportal/oygxuIUkkrRccUz.jpg', // cnpm logo image url
  adBanner: '',
  customReadmeFile: '', // you can use your custom readme file instead the cnpm one
  customFooter: '', // you can add copyright and site total script html here
  npmClientName: 'cnpm', // use `${name} install package`
  packagePageContributorSearch: true, // package page contributor link to search, default is true

  // max handle number of package.json `dependencies` property
  maxDependencies: 200,
  // backup filepath prefix
  backupFilePrefix: '/cnpm/backup/',

  /**
   * database config
   */

  database: {
    db: 'cnpmjs',
    username: 'root',
    password: 'Ydmap@2019',

    // the sql dialect of the database
    // - currently supported: 'mysql', 'sqlite', 'postgres', 'mariadb'
    dialect: 'mysql',

    // custom host; default: 127.0.0.1
    host: '127.0.0.1',

    // custom port; default: 3306
    port: 3306,

    // use pooling in order to reduce db connection overload and to increase speed
    // currently only for mysql and postgresql (since v1.5.0)
    pool: {
      maxConnections: 10,
      minConnections: 0,
      maxIdleTime: 30000
    },

    dialectOptions: {
      // if your server run on full cpu load, please set trace to false
      trace: true,
    },

    // the storage engine for 'sqlite'
    // default store into ~/.cnpmjs.org/data.sqlite
    storage: path.join(dataDir, 'data.sqlite'),

    logging: !!process.env.SQL_DEBUG,
  },

  // package tarball store in local filesystem by default
  nfs: require('fs-cnpm')({
    dir: path.join(dataDir, 'nfs')
  }),
  // if set true, will 302 redirect to `nfs.url(dist.key)`
  downloadRedirectToNFS: false,
  // don't check database and just download tgz from nfs
  downloadTgzDontCheckModule: false,

  // registry url name
  registryHost: 'registry.npm.vipwindows.com',

  /**
   * registry mode config
   */

  // enable private mode or not
  // private mode: only admins can publish, other users just can sync package from source npm
  // public mode: all users can publish
  enablePrivate: true,

  // registry scopes, if don't set, means do not support scopes
  scopes: [ '@ydmap' ],

  // some registry already have some private packages in global scope
  // but we want to treat them as scoped private packages,
  // so you can use this white list.
  privatePackages: [],

  /**
   * sync configs
   */

  // the official npm registry
  // cnpm wont directly sync from this one
  // but sometimes will request it for some package infomations
  // please don't change it if not necessary
  officialNpmRegistry: 'https://registry.npmjs.com',
  officialNpmReplicate: 'https://replicate.npmjs.com',

  // sync source, upstream registry
  // If you want to directly sync from official npm's registry
  // please drop them an email first
  sourceNpmRegistry: 'https://registry.npm.taobao.org',
  sourceNpmWeb: 'https://npm.taobao.org',

  // upstream registry is base on cnpm/cnpmjs.org or not
  // if your upstream is official npm registry, please turn it off
  sourceNpmRegistryIsCNpm: true,

  // if install return 404, try to sync from source registry
  syncByInstall: true,

  // sync mode select
  // none: do not sync any module, proxy all public modules from sourceNpmRegistry
  // exist: only sync exist modules
  // all: sync all modules
  syncModel: 'exist', // 'none', 'all', 'exist'

  syncConcurrency: 1,
  // sync interval, default is 10 minutes
  syncInterval: '10m',

  // sync polular modules, default to false
  // because cnpm can't auto sync tag change for now
  // so we want to sync popular modules to ensure their tags
  syncPopular: false,
  syncPopularInterval: '1h',
  // top 100
  topPopular: 100,

  // sync devDependencies or not, default is false
  syncDevDependencies: false,
  // try to remove all deleted versions from original registry
  syncDeletedVersions: true,

  // changes streaming sync
  syncChangesStream: false,
  syncDownloadOptions: {
    // formatRedirectUrl: function (url, location)
  },
  handleSyncRegistry: 'http://127.0.0.1:7001',

  // default badge subject
  badgeSubject: 'cnpm',
  // defautl use https://badgen.net/
  badgeService: {
    url: function(subject, status, options) {
      options = options || {};
      let url = `https://badgen.net/badge/${utility.encodeURIComponent(subject)}/${utility.encodeURIComponent(status)}`;
      if (options.color) {
        url += `/${utility.encodeURIComponent(options.color)}`;
      }
      if (options.icon) {
        url += `?icon=${utility.encodeURIComponent(options.icon)}`;
      }
      return url;
    },
  },

  packagephobiaURL: 'https://packagephobia.now.sh',
  packagephobiaSupportPrivatePackage: false,

  // custom user service, @see https://github.com/cnpm/cnpmjs.org/wiki/Use-Your-Own-User-Authorization
  // when you not intend to ingegrate with your company's user system, then use null, it would
  // use the default cnpm user system
  userService: null,

  // always-auth https://docs.npmjs.com/misc/config#always-auth
  // Force npm to always require authentication when accessing the registry, even for GET requests.
  alwaysAuth: false,

  // if you're behind firewall, need to request through http proxy, please set this
  // e.g.: `httpProxy: 'http://proxy.mycompany.com:8080'`
  httpProxy: null,

  // snyk.io root url
  snykUrl: 'https://snyk.io',

  // https://github.com/cnpm/cnpmjs.org/issues/1149
  // if enable this option, must create module_abbreviated and package_readme table in database
  enableAbbreviatedMetadata: false,

  // global hook function: function* (envelope) {}
  // envelope format please see https://github.com/npm/registry/blob/master/docs/hooks/hooks-payload.md#payload
  globalHook: null,

  opensearch: {
    host: '',
  },

  // redis cache
  redisCache: {
    enable: false,
    connectOptions: null,
  },
};

if (process.env.NODE_ENV === 'test') {
  config.enableAbbreviatedMetadata = true;
  config.customRegistryMiddlewares.push(() => {
    return function* (next) {
      this.set('x-custom-middleware', 'true');
      yield next;
    };
  });
}

if (process.env.NODE_ENV !== 'test') {
  var customConfig;
  if (process.env.NODE_ENV === 'development') {
    customConfig = path.join(root, 'config', 'config.js');
  } else {
    // 1. try to load `$dataDir/config.json` first, not exists then goto 2.
    // 2. load config/config.js, everything in config.js will cover the same key in index.js
    customConfig = path.join(dataDir, 'config.json');
    if (!fs.existsSync(customConfig)) {
      customConfig = path.join(root, 'config', 'config.js');
    }
  }
  if (fs.existsSync(customConfig)) {
    copy(require(customConfig)).override(config);
  }
}

mkdirp.sync(config.logdir);
mkdirp.sync(config.uploadDir);

module.exports = config;

config.loadConfig = function (customConfig) {
  if (!customConfig) {
    return;
  }
  copy(customConfig).override(config);
};
