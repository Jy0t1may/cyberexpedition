(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/@capacitor/core/dist/index.js
  var ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp, SystemBarsStyle, SystemBarType, SystemBarsPluginWeb, SystemBars;
  var init_dist = __esm({
    "node_modules/@capacitor/core/dist/index.js"() {
      (function(ExceptionCode2) {
        ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
        ExceptionCode2["Unavailable"] = "UNAVAILABLE";
      })(ExceptionCode || (ExceptionCode = {}));
      CapacitorException = class extends Error {
        constructor(message, code, data) {
          super(message);
          this.message = message;
          this.code = code;
          this.data = data;
        }
      };
      getPlatformId = (win) => {
        var _a, _b;
        if (win === null || win === void 0 ? void 0 : win.androidBridge) {
          return "android";
        } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
          return "ios";
        } else {
          return "web";
        }
      };
      createCapacitor = (win) => {
        const capCustomPlatform = win.CapacitorCustomPlatform || null;
        const cap = win.Capacitor || {};
        const Plugins = cap.Plugins = cap.Plugins || {};
        const getPlatform = () => {
          return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
        };
        const isNativePlatform = () => getPlatform() !== "web";
        const isPluginAvailable = (pluginName) => {
          const plugin = registeredPlugins.get(pluginName);
          if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
            return true;
          }
          if (getPluginHeader(pluginName)) {
            return true;
          }
          return false;
        };
        const getPluginHeader = (pluginName) => {
          var _a;
          return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
        };
        const handleError = (err) => win.console.error(err);
        const registeredPlugins = /* @__PURE__ */ new Map();
        const registerPlugin2 = (pluginName, jsImplementations = {}) => {
          const registeredPlugin = registeredPlugins.get(pluginName);
          if (registeredPlugin) {
            console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
            return registeredPlugin.proxy;
          }
          const platform = getPlatform();
          const pluginHeader = getPluginHeader(pluginName);
          let jsImplementation;
          const loadPluginImplementation = async () => {
            if (!jsImplementation && platform in jsImplementations) {
              jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
            } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
              jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
            }
            return jsImplementation;
          };
          const createPluginMethod = (impl, prop) => {
            var _a, _b;
            if (pluginHeader) {
              const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
              if (methodHeader) {
                if (methodHeader.rtype === "promise") {
                  return (options) => cap.nativePromise(pluginName, prop.toString(), options);
                } else {
                  return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
                }
              } else if (impl) {
                return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
              }
            } else if (impl) {
              return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
            } else {
              throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
            }
          };
          const createPluginMethodWrapper = (prop) => {
            let remove;
            const wrapper = (...args) => {
              const p = loadPluginImplementation().then((impl) => {
                const fn = createPluginMethod(impl, prop);
                if (fn) {
                  const p2 = fn(...args);
                  remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                  return p2;
                } else {
                  throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
                }
              });
              if (prop === "addListener") {
                p.remove = async () => remove();
              }
              return p;
            };
            wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
            Object.defineProperty(wrapper, "name", {
              value: prop,
              writable: false,
              configurable: false
            });
            return wrapper;
          };
          const addListener = createPluginMethodWrapper("addListener");
          const removeListener = createPluginMethodWrapper("removeListener");
          const addListenerNative = (eventName, callback) => {
            const call = addListener({ eventName }, callback);
            const remove = async () => {
              const callbackId = await call;
              removeListener({
                eventName,
                callbackId
              }, callback);
            };
            const p = new Promise((resolve2) => call.then(() => resolve2({ remove })));
            p.remove = async () => {
              console.warn(`Using addListener() without 'await' is deprecated.`);
              await remove();
            };
            return p;
          };
          const proxy = new Proxy({}, {
            get(_, prop) {
              switch (prop) {
                // https://github.com/facebook/react/issues/20030
                case "$$typeof":
                  return void 0;
                case "toJSON":
                  return () => ({});
                case "addListener":
                  return pluginHeader ? addListenerNative : addListener;
                case "removeListener":
                  return removeListener;
                default:
                  return createPluginMethodWrapper(prop);
              }
            }
          });
          Plugins[pluginName] = proxy;
          registeredPlugins.set(pluginName, {
            name: pluginName,
            proxy,
            platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
          });
          return proxy;
        };
        if (!cap.convertFileSrc) {
          cap.convertFileSrc = (filePath) => filePath;
        }
        cap.getPlatform = getPlatform;
        cap.handleError = handleError;
        cap.isNativePlatform = isNativePlatform;
        cap.isPluginAvailable = isPluginAvailable;
        cap.registerPlugin = registerPlugin2;
        cap.Exception = CapacitorException;
        cap.DEBUG = !!cap.DEBUG;
        cap.isLoggingEnabled = !!cap.isLoggingEnabled;
        return cap;
      };
      initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
      Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
      registerPlugin = Capacitor.registerPlugin;
      WebPlugin = class {
        constructor() {
          this.listeners = {};
          this.retainedEventArguments = {};
          this.windowListeners = {};
        }
        addListener(eventName, listenerFunc) {
          let firstListener = false;
          const listeners = this.listeners[eventName];
          if (!listeners) {
            this.listeners[eventName] = [];
            firstListener = true;
          }
          this.listeners[eventName].push(listenerFunc);
          const windowListener = this.windowListeners[eventName];
          if (windowListener && !windowListener.registered) {
            this.addWindowListener(windowListener);
          }
          if (firstListener) {
            this.sendRetainedArgumentsForEvent(eventName);
          }
          const remove = async () => this.removeListener(eventName, listenerFunc);
          const p = Promise.resolve({ remove });
          return p;
        }
        async removeAllListeners() {
          this.listeners = {};
          for (const listener in this.windowListeners) {
            this.removeWindowListener(this.windowListeners[listener]);
          }
          this.windowListeners = {};
        }
        notifyListeners(eventName, data, retainUntilConsumed) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            if (retainUntilConsumed) {
              let args = this.retainedEventArguments[eventName];
              if (!args) {
                args = [];
              }
              args.push(data);
              this.retainedEventArguments[eventName] = args;
            }
            return;
          }
          listeners.forEach((listener) => listener(data));
        }
        hasListeners(eventName) {
          var _a;
          return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
        }
        registerWindowListener(windowEventName, pluginEventName) {
          this.windowListeners[pluginEventName] = {
            registered: false,
            windowEventName,
            pluginEventName,
            handler: (event) => {
              this.notifyListeners(pluginEventName, event);
            }
          };
        }
        unimplemented(msg = "not implemented") {
          return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
        }
        unavailable(msg = "not available") {
          return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
        }
        async removeListener(eventName, listenerFunc) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            return;
          }
          const index = listeners.indexOf(listenerFunc);
          if (index !== -1) {
            this.listeners[eventName].splice(index, 1);
          }
          if (!this.listeners[eventName].length) {
            this.removeWindowListener(this.windowListeners[eventName]);
          }
        }
        addWindowListener(handle) {
          window.addEventListener(handle.windowEventName, handle.handler);
          handle.registered = true;
        }
        removeWindowListener(handle) {
          if (!handle) {
            return;
          }
          window.removeEventListener(handle.windowEventName, handle.handler);
          handle.registered = false;
        }
        sendRetainedArgumentsForEvent(eventName) {
          const args = this.retainedEventArguments[eventName];
          if (!args) {
            return;
          }
          delete this.retainedEventArguments[eventName];
          args.forEach((arg) => {
            this.notifyListeners(eventName, arg);
          });
        }
      };
      encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
      decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
      CapacitorCookiesPluginWeb = class extends WebPlugin {
        async getCookies() {
          const cookies = document.cookie;
          const cookieMap = {};
          cookies.split(";").forEach((cookie) => {
            if (cookie.length <= 0)
              return;
            let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
            key = decode(key).trim();
            value = decode(value).trim();
            cookieMap[key] = value;
          });
          return cookieMap;
        }
        async setCookie(options) {
          try {
            const encodedKey = encode(options.key);
            const encodedValue = encode(options.value);
            const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
            const path = (options.path || "/").replace("path=", "");
            const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
            document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async deleteCookie(options) {
          try {
            document.cookie = `${options.key}=; Max-Age=0`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearCookies() {
          try {
            const cookies = document.cookie.split(";") || [];
            for (const cookie of cookies) {
              document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
            }
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearAllCookies() {
          try {
            await this.clearCookies();
          } catch (error) {
            return Promise.reject(error);
          }
        }
      };
      CapacitorCookies = registerPlugin("CapacitorCookies", {
        web: () => new CapacitorCookiesPluginWeb()
      });
      readBlobAsBase64 = async (blob) => new Promise((resolve2, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result;
          resolve2(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
      normalizeHttpHeaders = (headers = {}) => {
        const originalKeys = Object.keys(headers);
        const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
        const normalized = loweredKeys.reduce((acc, key, index) => {
          acc[key] = headers[originalKeys[index]];
          return acc;
        }, {});
        return normalized;
      };
      buildUrlParams = (params, shouldEncode = true) => {
        if (!params)
          return null;
        const output = Object.entries(params).reduce((accumulator, entry) => {
          const [key, value] = entry;
          let encodedValue;
          let item;
          if (Array.isArray(value)) {
            item = "";
            value.forEach((str) => {
              encodedValue = shouldEncode ? encodeURIComponent(str) : str;
              item += `${key}=${encodedValue}&`;
            });
            item.slice(0, -1);
          } else {
            encodedValue = shouldEncode ? encodeURIComponent(value) : value;
            item = `${key}=${encodedValue}`;
          }
          return `${accumulator}&${item}`;
        }, "");
        return output.substr(1);
      };
      buildRequestInit = (options, extra = {}) => {
        const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
        const headers = normalizeHttpHeaders(options.headers);
        const type = headers["content-type"] || "";
        if (typeof options.data === "string") {
          output.body = options.data;
        } else if (type.includes("application/x-www-form-urlencoded")) {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(options.data || {})) {
            params.set(key, value);
          }
          output.body = params.toString();
        } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
          const form = new FormData();
          if (options.data instanceof FormData) {
            options.data.forEach((value, key) => {
              form.append(key, value);
            });
          } else {
            for (const key of Object.keys(options.data)) {
              form.append(key, options.data[key]);
            }
          }
          output.body = form;
          const headers2 = new Headers(output.headers);
          headers2.delete("content-type");
          output.headers = headers2;
        } else if (type.includes("application/json") || typeof options.data === "object") {
          output.body = JSON.stringify(options.data);
        }
        return output;
      };
      CapacitorHttpPluginWeb = class extends WebPlugin {
        /**
         * Perform an Http request given a set of options
         * @param options Options to build the HTTP request
         */
        async request(options) {
          const requestInit = buildRequestInit(options, options.webFetchExtra);
          const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
          const url = urlParams ? `${options.url}?${urlParams}` : options.url;
          const response = await fetch(url, requestInit);
          const contentType = response.headers.get("content-type") || "";
          let { responseType = "text" } = response.ok ? options : {};
          if (contentType.includes("application/json")) {
            responseType = "json";
          }
          let data;
          let blob;
          switch (responseType) {
            case "arraybuffer":
            case "blob":
              blob = await response.blob();
              data = await readBlobAsBase64(blob);
              break;
            case "json":
              data = await response.json();
              break;
            case "document":
            case "text":
            default:
              data = await response.text();
          }
          const headers = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });
          return {
            data,
            headers,
            status: response.status,
            url: response.url
          };
        }
        /**
         * Perform an Http GET request given a set of options
         * @param options Options to build the HTTP request
         */
        async get(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
        }
        /**
         * Perform an Http POST request given a set of options
         * @param options Options to build the HTTP request
         */
        async post(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
        }
        /**
         * Perform an Http PUT request given a set of options
         * @param options Options to build the HTTP request
         */
        async put(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
        }
        /**
         * Perform an Http PATCH request given a set of options
         * @param options Options to build the HTTP request
         */
        async patch(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
        }
        /**
         * Perform an Http DELETE request given a set of options
         * @param options Options to build the HTTP request
         */
        async delete(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
        }
      };
      CapacitorHttp = registerPlugin("CapacitorHttp", {
        web: () => new CapacitorHttpPluginWeb()
      });
      (function(SystemBarsStyle2) {
        SystemBarsStyle2["Dark"] = "DARK";
        SystemBarsStyle2["Light"] = "LIGHT";
        SystemBarsStyle2["Default"] = "DEFAULT";
      })(SystemBarsStyle || (SystemBarsStyle = {}));
      (function(SystemBarType2) {
        SystemBarType2["StatusBar"] = "StatusBar";
        SystemBarType2["NavigationBar"] = "NavigationBar";
      })(SystemBarType || (SystemBarType = {}));
      SystemBarsPluginWeb = class extends WebPlugin {
        async setStyle() {
          this.unavailable("not available for web");
        }
        async setAnimation() {
          this.unavailable("not available for web");
        }
        async show() {
          this.unavailable("not available for web");
        }
        async hide() {
          this.unavailable("not available for web");
        }
      };
      SystemBars = registerPlugin("SystemBars", {
        web: () => new SystemBarsPluginWeb()
      });
    }
  });

  // node_modules/@capacitor/filesystem/dist/esm/definitions.js
  var Directory, Encoding;
  var init_definitions = __esm({
    "node_modules/@capacitor/filesystem/dist/esm/definitions.js"() {
      (function(Directory2) {
        Directory2["Documents"] = "DOCUMENTS";
        Directory2["Data"] = "DATA";
        Directory2["Library"] = "LIBRARY";
        Directory2["Cache"] = "CACHE";
        Directory2["External"] = "EXTERNAL";
        Directory2["ExternalStorage"] = "EXTERNAL_STORAGE";
        Directory2["ExternalCache"] = "EXTERNAL_CACHE";
        Directory2["LibraryNoCloud"] = "LIBRARY_NO_CLOUD";
        Directory2["Temporary"] = "TEMPORARY";
      })(Directory || (Directory = {}));
      (function(Encoding2) {
        Encoding2["UTF8"] = "utf8";
        Encoding2["ASCII"] = "ascii";
        Encoding2["UTF16"] = "utf16";
      })(Encoding || (Encoding = {}));
    }
  });

  // node_modules/@capacitor/filesystem/dist/esm/web.js
  var web_exports = {};
  __export(web_exports, {
    FilesystemWeb: () => FilesystemWeb
  });
  function resolve(path) {
    const posix = path.split("/").filter((item) => item !== ".");
    const newPosix = [];
    posix.forEach((item) => {
      if (item === ".." && newPosix.length > 0 && newPosix[newPosix.length - 1] !== "..") {
        newPosix.pop();
      } else {
        newPosix.push(item);
      }
    });
    return newPosix.join("/");
  }
  function isPathParent(parent, children) {
    parent = resolve(parent);
    children = resolve(children);
    const pathsA = parent.split("/");
    const pathsB = children.split("/");
    return parent !== children && pathsA.every((value, index) => value === pathsB[index]);
  }
  var FilesystemWeb;
  var init_web = __esm({
    "node_modules/@capacitor/filesystem/dist/esm/web.js"() {
      init_dist();
      init_definitions();
      FilesystemWeb = class _FilesystemWeb extends WebPlugin {
        constructor() {
          super(...arguments);
          this.DB_VERSION = 1;
          this.DB_NAME = "Disc";
          this._writeCmds = ["add", "put", "delete"];
          this.downloadFile = async (options) => {
            var _a, _b;
            const requestInit = buildRequestInit(options, options.webFetchExtra);
            const response = await fetch(options.url, requestInit);
            let blob;
            if (!options.progress)
              blob = await response.blob();
            else if (!(response === null || response === void 0 ? void 0 : response.body))
              blob = new Blob();
            else {
              const reader = response.body.getReader();
              let bytes = 0;
              const chunks = [];
              const contentType = response.headers.get("content-type");
              const contentLength = parseInt(response.headers.get("content-length") || "0", 10);
              while (true) {
                const { done, value } = await reader.read();
                if (done)
                  break;
                chunks.push(value);
                bytes += (value === null || value === void 0 ? void 0 : value.length) || 0;
                const status = {
                  url: options.url,
                  bytes,
                  contentLength
                };
                this.notifyListeners("progress", status);
              }
              const allChunks = new Uint8Array(bytes);
              let position = 0;
              for (const chunk of chunks) {
                if (typeof chunk === "undefined")
                  continue;
                allChunks.set(chunk, position);
                position += chunk.length;
              }
              blob = new Blob([allChunks.buffer], { type: contentType || void 0 });
            }
            const result = await this.writeFile({
              path: options.path,
              directory: (_a = options.directory) !== null && _a !== void 0 ? _a : void 0,
              recursive: (_b = options.recursive) !== null && _b !== void 0 ? _b : false,
              data: blob
            });
            return { path: result.uri, blob };
          };
        }
        readFileInChunks(_options, _callback) {
          throw this.unavailable("Method not implemented.");
        }
        async initDb() {
          if (this._db !== void 0) {
            return this._db;
          }
          if (!("indexedDB" in window)) {
            throw this.unavailable("This browser doesn't support IndexedDB");
          }
          return new Promise((resolve2, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            request.onupgradeneeded = _FilesystemWeb.doUpgrade;
            request.onsuccess = () => {
              this._db = request.result;
              resolve2(request.result);
            };
            request.onerror = () => reject(request.error);
            request.onblocked = () => {
              console.warn("db blocked");
            };
          });
        }
        static doUpgrade(event) {
          const eventTarget = event.target;
          const db = eventTarget.result;
          switch (event.oldVersion) {
            case 0:
            case 1:
            default: {
              if (db.objectStoreNames.contains("FileStorage")) {
                db.deleteObjectStore("FileStorage");
              }
              const store = db.createObjectStore("FileStorage", { keyPath: "path" });
              store.createIndex("by_folder", "folder");
            }
          }
        }
        async dbRequest(cmd, args) {
          const readFlag = this._writeCmds.indexOf(cmd) !== -1 ? "readwrite" : "readonly";
          return this.initDb().then((conn) => {
            return new Promise((resolve2, reject) => {
              const tx = conn.transaction(["FileStorage"], readFlag);
              const store = tx.objectStore("FileStorage");
              const req = store[cmd](...args);
              req.onsuccess = () => resolve2(req.result);
              req.onerror = () => reject(req.error);
            });
          });
        }
        async dbIndexRequest(indexName, cmd, args) {
          const readFlag = this._writeCmds.indexOf(cmd) !== -1 ? "readwrite" : "readonly";
          return this.initDb().then((conn) => {
            return new Promise((resolve2, reject) => {
              const tx = conn.transaction(["FileStorage"], readFlag);
              const store = tx.objectStore("FileStorage");
              const index = store.index(indexName);
              const req = index[cmd](...args);
              req.onsuccess = () => resolve2(req.result);
              req.onerror = () => reject(req.error);
            });
          });
        }
        getPath(directory, uriPath) {
          const cleanedUriPath = uriPath !== void 0 ? uriPath.replace(/^[/]+|[/]+$/g, "") : "";
          let fsPath = "";
          if (directory !== void 0)
            fsPath += "/" + directory;
          if (uriPath !== "")
            fsPath += "/" + cleanedUriPath;
          return fsPath;
        }
        async clear() {
          const conn = await this.initDb();
          const tx = conn.transaction(["FileStorage"], "readwrite");
          const store = tx.objectStore("FileStorage");
          store.clear();
        }
        /**
         * Read a file from disk
         * @param options options for the file read
         * @return a promise that resolves with the read file data result
         */
        async readFile(options) {
          const path = this.getPath(options.directory, options.path);
          const entry = await this.dbRequest("get", [path]);
          if (entry === void 0)
            throw Error("File does not exist.");
          return { data: entry.content ? entry.content : "" };
        }
        /**
         * Write a file to disk in the specified location on device
         * @param options options for the file write
         * @return a promise that resolves with the file write result
         */
        async writeFile(options) {
          const path = this.getPath(options.directory, options.path);
          let data = options.data;
          const encoding = options.encoding;
          const doRecursive = options.recursive;
          const occupiedEntry = await this.dbRequest("get", [path]);
          if (occupiedEntry && occupiedEntry.type === "directory")
            throw Error("The supplied path is a directory.");
          const parentPath = path.substr(0, path.lastIndexOf("/"));
          const parentEntry = await this.dbRequest("get", [parentPath]);
          if (parentEntry === void 0) {
            const subDirIndex = parentPath.indexOf("/", 1);
            if (subDirIndex !== -1) {
              const parentArgPath = parentPath.substr(subDirIndex);
              await this.mkdir({
                path: parentArgPath,
                directory: options.directory,
                recursive: doRecursive
              });
            }
          }
          if (!encoding && !(data instanceof Blob)) {
            data = data.indexOf(",") >= 0 ? data.split(",")[1] : data;
            if (!this.isBase64String(data))
              throw Error("The supplied data is not valid base64 content.");
          }
          const now = Date.now();
          const pathObj = {
            path,
            folder: parentPath,
            type: "file",
            size: data instanceof Blob ? data.size : data.length,
            ctime: now,
            mtime: now,
            content: data
          };
          await this.dbRequest("put", [pathObj]);
          return {
            uri: pathObj.path
          };
        }
        /**
         * Append to a file on disk in the specified location on device
         * @param options options for the file append
         * @return a promise that resolves with the file write result
         */
        async appendFile(options) {
          const path = this.getPath(options.directory, options.path);
          let data = options.data;
          const encoding = options.encoding;
          const parentPath = path.substr(0, path.lastIndexOf("/"));
          const now = Date.now();
          let ctime = now;
          const occupiedEntry = await this.dbRequest("get", [path]);
          if (occupiedEntry && occupiedEntry.type === "directory")
            throw Error("The supplied path is a directory.");
          const parentEntry = await this.dbRequest("get", [parentPath]);
          if (parentEntry === void 0) {
            const subDirIndex = parentPath.indexOf("/", 1);
            if (subDirIndex !== -1) {
              const parentArgPath = parentPath.substr(subDirIndex);
              await this.mkdir({
                path: parentArgPath,
                directory: options.directory,
                recursive: true
              });
            }
          }
          if (!encoding && !this.isBase64String(data))
            throw Error("The supplied data is not valid base64 content.");
          if (occupiedEntry !== void 0) {
            if (occupiedEntry.content instanceof Blob) {
              throw Error("The occupied entry contains a Blob object which cannot be appended to.");
            }
            if (occupiedEntry.content !== void 0 && !encoding) {
              data = btoa(atob(occupiedEntry.content) + atob(data));
            } else {
              data = occupiedEntry.content + data;
            }
            ctime = occupiedEntry.ctime;
          }
          const pathObj = {
            path,
            folder: parentPath,
            type: "file",
            size: data.length,
            ctime,
            mtime: now,
            content: data
          };
          await this.dbRequest("put", [pathObj]);
        }
        /**
         * Delete a file from disk
         * @param options options for the file delete
         * @return a promise that resolves with the deleted file data result
         */
        async deleteFile(options) {
          const path = this.getPath(options.directory, options.path);
          const entry = await this.dbRequest("get", [path]);
          if (entry === void 0)
            throw Error("File does not exist.");
          const entries = await this.dbIndexRequest("by_folder", "getAllKeys", [IDBKeyRange.only(path)]);
          if (entries.length !== 0)
            throw Error("Folder is not empty.");
          await this.dbRequest("delete", [path]);
        }
        /**
         * Create a directory.
         * @param options options for the mkdir
         * @return a promise that resolves with the mkdir result
         */
        async mkdir(options) {
          const path = this.getPath(options.directory, options.path);
          const doRecursive = options.recursive;
          const parentPath = path.substr(0, path.lastIndexOf("/"));
          const depth = (path.match(/\//g) || []).length;
          const parentEntry = await this.dbRequest("get", [parentPath]);
          const occupiedEntry = await this.dbRequest("get", [path]);
          if (depth === 1)
            throw Error("Cannot create Root directory");
          if (occupiedEntry !== void 0)
            throw Error("Current directory does already exist.");
          if (!doRecursive && depth !== 2 && parentEntry === void 0)
            throw Error("Parent directory must exist");
          if (doRecursive && depth !== 2 && parentEntry === void 0) {
            const parentArgPath = parentPath.substr(parentPath.indexOf("/", 1));
            await this.mkdir({
              path: parentArgPath,
              directory: options.directory,
              recursive: doRecursive
            });
          }
          const now = Date.now();
          const pathObj = {
            path,
            folder: parentPath,
            type: "directory",
            size: 0,
            ctime: now,
            mtime: now
          };
          await this.dbRequest("put", [pathObj]);
        }
        /**
         * Remove a directory
         * @param options the options for the directory remove
         */
        async rmdir(options) {
          const { path, directory, recursive } = options;
          const fullPath = this.getPath(directory, path);
          const entry = await this.dbRequest("get", [fullPath]);
          if (entry === void 0)
            throw Error("Folder does not exist.");
          if (entry.type !== "directory")
            throw Error("Requested path is not a directory");
          const readDirResult = await this.readdir({ path, directory });
          if (readDirResult.files.length !== 0 && !recursive)
            throw Error("Folder is not empty");
          for (const entry2 of readDirResult.files) {
            const entryPath = `${path}/${entry2.name}`;
            const entryObj = await this.stat({ path: entryPath, directory });
            if (entryObj.type === "file") {
              await this.deleteFile({ path: entryPath, directory });
            } else {
              await this.rmdir({ path: entryPath, directory, recursive });
            }
          }
          await this.dbRequest("delete", [fullPath]);
        }
        /**
         * Return a list of files from the directory (not recursive)
         * @param options the options for the readdir operation
         * @return a promise that resolves with the readdir directory listing result
         */
        async readdir(options) {
          const path = this.getPath(options.directory, options.path);
          const entry = await this.dbRequest("get", [path]);
          if (options.path !== "" && entry === void 0)
            throw Error("Folder does not exist.");
          const entries = await this.dbIndexRequest("by_folder", "getAllKeys", [IDBKeyRange.only(path)]);
          const files = await Promise.all(entries.map(async (e) => {
            let subEntry = await this.dbRequest("get", [e]);
            if (subEntry === void 0) {
              subEntry = await this.dbRequest("get", [e + "/"]);
            }
            return {
              name: e.substring(path.length + 1),
              type: subEntry.type,
              size: subEntry.size,
              ctime: subEntry.ctime,
              mtime: subEntry.mtime,
              uri: subEntry.path
            };
          }));
          return { files };
        }
        /**
         * Return full File URI for a path and directory
         * @param options the options for the stat operation
         * @return a promise that resolves with the file stat result
         */
        async getUri(options) {
          const path = this.getPath(options.directory, options.path);
          let entry = await this.dbRequest("get", [path]);
          if (entry === void 0) {
            entry = await this.dbRequest("get", [path + "/"]);
          }
          return {
            uri: (entry === null || entry === void 0 ? void 0 : entry.path) || path
          };
        }
        /**
         * Return data about a file
         * @param options the options for the stat operation
         * @return a promise that resolves with the file stat result
         */
        async stat(options) {
          const path = this.getPath(options.directory, options.path);
          let entry = await this.dbRequest("get", [path]);
          if (entry === void 0) {
            entry = await this.dbRequest("get", [path + "/"]);
          }
          if (entry === void 0)
            throw Error("Entry does not exist.");
          return {
            name: entry.path.substring(path.length + 1),
            type: entry.type,
            size: entry.size,
            ctime: entry.ctime,
            mtime: entry.mtime,
            uri: entry.path
          };
        }
        /**
         * Rename a file or directory
         * @param options the options for the rename operation
         * @return a promise that resolves with the rename result
         */
        async rename(options) {
          await this._copy(options, true);
          return;
        }
        /**
         * Copy a file or directory
         * @param options the options for the copy operation
         * @return a promise that resolves with the copy result
         */
        async copy(options) {
          return this._copy(options, false);
        }
        async requestPermissions() {
          return { publicStorage: "granted" };
        }
        async checkPermissions() {
          return { publicStorage: "granted" };
        }
        /**
         * Function that can perform a copy or a rename
         * @param options the options for the rename operation
         * @param doRename whether to perform a rename or copy operation
         * @return a promise that resolves with the result
         */
        async _copy(options, doRename = false) {
          let { toDirectory } = options;
          const { to, from, directory: fromDirectory } = options;
          if (!to || !from) {
            throw Error("Both to and from must be provided");
          }
          if (!toDirectory) {
            toDirectory = fromDirectory;
          }
          const fromPath = this.getPath(fromDirectory, from);
          const toPath = this.getPath(toDirectory, to);
          if (fromPath === toPath) {
            return {
              uri: toPath
            };
          }
          if (isPathParent(fromPath, toPath)) {
            throw Error("To path cannot contain the from path");
          }
          let toObj;
          try {
            toObj = await this.stat({
              path: to,
              directory: toDirectory
            });
          } catch (e) {
            const toPathComponents = to.split("/");
            toPathComponents.pop();
            const toPath2 = toPathComponents.join("/");
            if (toPathComponents.length > 0) {
              const toParentDirectory = await this.stat({
                path: toPath2,
                directory: toDirectory
              });
              if (toParentDirectory.type !== "directory") {
                throw new Error("Parent directory of the to path is a file");
              }
            }
          }
          if (toObj && toObj.type === "directory") {
            throw new Error("Cannot overwrite a directory with a file");
          }
          const fromObj = await this.stat({
            path: from,
            directory: fromDirectory
          });
          const updateTime = async (path, ctime2, mtime) => {
            const fullPath = this.getPath(toDirectory, path);
            const entry = await this.dbRequest("get", [fullPath]);
            entry.ctime = ctime2;
            entry.mtime = mtime;
            await this.dbRequest("put", [entry]);
          };
          const ctime = fromObj.ctime ? fromObj.ctime : Date.now();
          switch (fromObj.type) {
            // The "from" object is a file
            case "file": {
              const file = await this.readFile({
                path: from,
                directory: fromDirectory
              });
              if (doRename) {
                await this.deleteFile({
                  path: from,
                  directory: fromDirectory
                });
              }
              let encoding;
              if (!(file.data instanceof Blob) && !this.isBase64String(file.data)) {
                encoding = Encoding.UTF8;
              }
              const writeResult = await this.writeFile({
                path: to,
                directory: toDirectory,
                data: file.data,
                encoding
              });
              if (doRename) {
                await updateTime(to, ctime, fromObj.mtime);
              }
              return writeResult;
            }
            case "directory": {
              if (toObj) {
                throw Error("Cannot move a directory over an existing object");
              }
              try {
                await this.mkdir({
                  path: to,
                  directory: toDirectory,
                  recursive: false
                });
                if (doRename) {
                  await updateTime(to, ctime, fromObj.mtime);
                }
              } catch (e) {
              }
              const contents = (await this.readdir({
                path: from,
                directory: fromDirectory
              })).files;
              for (const filename of contents) {
                await this._copy({
                  from: `${from}/${filename.name}`,
                  to: `${to}/${filename.name}`,
                  directory: fromDirectory,
                  toDirectory
                }, doRename);
              }
              if (doRename) {
                await this.rmdir({
                  path: from,
                  directory: fromDirectory
                });
              }
            }
          }
          return {
            uri: toPath
          };
        }
        isBase64String(str) {
          try {
            return btoa(atob(str)) == str;
          } catch (err) {
            return false;
          }
        }
      };
      FilesystemWeb._debug = true;
    }
  });

  // node_modules/@capacitor/preferences/dist/esm/web.js
  var web_exports2 = {};
  __export(web_exports2, {
    PreferencesWeb: () => PreferencesWeb
  });
  var PreferencesWeb;
  var init_web2 = __esm({
    "node_modules/@capacitor/preferences/dist/esm/web.js"() {
      init_dist();
      PreferencesWeb = class extends WebPlugin {
        constructor() {
          super(...arguments);
          this.group = "CapacitorStorage";
        }
        async configure({ group }) {
          if (typeof group === "string") {
            this.group = group;
          }
        }
        async get(options) {
          const value = this.impl.getItem(this.applyPrefix(options.key));
          return { value };
        }
        async set(options) {
          this.impl.setItem(this.applyPrefix(options.key), options.value);
        }
        async remove(options) {
          this.impl.removeItem(this.applyPrefix(options.key));
        }
        async keys() {
          const keys = this.rawKeys().map((k) => k.substring(this.prefix.length));
          return { keys };
        }
        async clear() {
          for (const key of this.rawKeys()) {
            this.impl.removeItem(key);
          }
        }
        async migrate() {
          var _a;
          const migrated = [];
          const existing = [];
          const oldprefix = "_cap_";
          const keys = Object.keys(this.impl).filter((k) => k.indexOf(oldprefix) === 0);
          for (const oldkey of keys) {
            const key = oldkey.substring(oldprefix.length);
            const value = (_a = this.impl.getItem(oldkey)) !== null && _a !== void 0 ? _a : "";
            const { value: currentValue } = await this.get({ key });
            if (typeof currentValue === "string") {
              existing.push(key);
            } else {
              await this.set({ key, value });
              migrated.push(key);
            }
          }
          return { migrated, existing };
        }
        async removeOld() {
          const oldprefix = "_cap_";
          const keys = Object.keys(this.impl).filter((k) => k.indexOf(oldprefix) === 0);
          for (const oldkey of keys) {
            this.impl.removeItem(oldkey);
          }
        }
        get impl() {
          return window.localStorage;
        }
        get prefix() {
          return this.group === "NativeStorage" ? "" : `${this.group}.`;
        }
        rawKeys() {
          return Object.keys(this.impl).filter((k) => k.indexOf(this.prefix) === 0);
        }
        applyPrefix(key) {
          return this.prefix + key;
        }
      };
    }
  });

  // node_modules/@capacitor/browser/dist/esm/web.js
  var web_exports3 = {};
  __export(web_exports3, {
    Browser: () => Browser,
    BrowserWeb: () => BrowserWeb
  });
  var BrowserWeb, Browser;
  var init_web3 = __esm({
    "node_modules/@capacitor/browser/dist/esm/web.js"() {
      init_dist();
      BrowserWeb = class extends WebPlugin {
        constructor() {
          super();
          this._lastWindow = null;
        }
        async open(options) {
          this._lastWindow = window.open(options.url, options.windowName || "_blank");
        }
        async close() {
          return new Promise((resolve2, reject) => {
            if (this._lastWindow != null) {
              this._lastWindow.close();
              this._lastWindow = null;
              resolve2();
            } else {
              reject("No active window to close!");
            }
          });
        }
      };
      Browser = new BrowserWeb();
    }
  });

  // src/app.mjs
  init_dist();

  // node_modules/@capacitor/filesystem/dist/esm/index.js
  init_dist();

  // node_modules/@capacitor/synapse/dist/synapse.mjs
  function s(t) {
    t.CapacitorUtils.Synapse = new Proxy(
      {},
      {
        get(e, n) {
          return new Proxy({}, {
            get(w, o) {
              return (c, p, r) => {
                const i = t.Capacitor.Plugins[n];
                if (i === void 0) {
                  r(new Error(`Capacitor plugin ${n} not found`));
                  return;
                }
                if (typeof i[o] != "function") {
                  r(new Error(`Method ${o} not found in Capacitor plugin ${n}`));
                  return;
                }
                (async () => {
                  try {
                    const a = await i[o](c);
                    p(a);
                  } catch (a) {
                    r(a);
                  }
                })();
              };
            }
          });
        }
      }
    );
  }
  function u(t) {
    t.CapacitorUtils.Synapse = new Proxy(
      {},
      {
        get(e, n) {
          return t.cordova.plugins[n];
        }
      }
    );
  }
  function f(t = false) {
    typeof window > "u" || (window.CapacitorUtils = window.CapacitorUtils || {}, window.Capacitor !== void 0 && !t ? s(window) : window.cordova !== void 0 && u(window));
  }

  // node_modules/@capacitor/filesystem/dist/esm/index.js
  init_definitions();
  var Filesystem = registerPlugin("Filesystem", {
    web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.FilesystemWeb())
  });
  f();

  // node_modules/@capacitor/preferences/dist/esm/index.js
  init_dist();
  var Preferences = registerPlugin("Preferences", {
    web: () => Promise.resolve().then(() => (init_web2(), web_exports2)).then((m) => new m.PreferencesWeb())
  });

  // node_modules/@capacitor/browser/dist/esm/index.js
  init_dist();
  var Browser2 = registerPlugin("Browser", {
    web: () => Promise.resolve().then(() => (init_web3(), web_exports3)).then((m) => new m.BrowserWeb())
  });

  // src/feed.mjs
  var FEEDS = [
    { id: "tldrsec", url: "https://rss.beehiiv.com/feeds/xgTKUmMmUm.xml" },
    { id: "risky", url: "https://risky.biz/feeds/risky-business-news/" },
    { id: "sans", url: "https://isc.sans.edu/rssfeed.xml" },
    { id: "krebs", url: "https://krebsonsecurity.com/feed/" }
  ];
  var text = (node, tag) => node.getElementsByTagName(tag)[0]?.textContent?.trim() || "";
  var safeLink = (raw) => {
    try {
      const u2 = new URL(raw);
      return ["https:", "http:"].includes(u2.protocol) ? u2.href : "";
    } catch {
      return "";
    }
  };
  var plain = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("script,style").forEach((n) => n.remove());
    return doc.body.textContent.replace(/\s+/g, " ").trim().slice(0, 220);
  };
  function parseFeed(xml, source) {
    const doc = new DOMParser().parseFromString(String(xml), "application/xml");
    if (doc.querySelector("parsererror")) throw Error("Invalid XML");
    if (!["rss", "feed", "RDF"].includes(doc.documentElement.localName)) throw Error("Not an RSS or Atom feed");
    const entries = [...doc.getElementsByTagName("item"), ...doc.getElementsByTagName("entry")];
    return entries.map((item) => {
      const linkNode = [...item.getElementsByTagName("link")].find((n) => n.getAttribute("rel") === "alternate") || item.getElementsByTagName("link")[0];
      const url = safeLink(linkNode?.getAttribute("href") || linkNode?.textContent?.trim() || "");
      const title = text(item, "title").replace(/\s+/g, " ").trim();
      const desc = text(item, "description") || text(item, "summary") || text(item, "content");
      const date2 = text(item, "pubDate") || text(item, "published") || text(item, "updated");
      const ms = Date.parse(date2);
      return {
        id: source.id + "-" + url,
        source: source.id,
        sourceName: source.name,
        title,
        url,
        extract: plain(desc),
        published: Number.isFinite(ms) ? new Date(ms).toISOString() : "1970-01-01T00:00:00.000Z",
        tags: []
      };
    }).filter((a) => a.title && a.url).slice(0, 40);
  }
  function mergeNews(old, updates, when) {
    const current2 = Array.isArray(old?.articles) ? old.articles : [];
    const ids = Object.keys(updates);
    const newer = ids.flatMap((id) => updates[id] || []);
    const unique = /* @__PURE__ */ new Map();
    for (const row of [...newer, ...current2]) if (row?.url && !unique.has(row.url)) unique.set(row.url, row);
    const articles = [...unique.values()].sort((a, b) => Date.parse(b.published || 0) - Date.parse(a.published || 0)).slice(0, 180);
    return { ...old, articles, fetchedAt: when, sourcesOk: ids.length };
  }
  async function refreshFeeds({ baseline, feeds, request, parse = parseFeed, now = () => (/* @__PURE__ */ new Date()).toISOString() }) {
    const updates = {}, failed = [];
    await Promise.all(feeds.map(async (feed) => {
      try {
        const source = baseline.sources.find((s2) => s2.id === feed.id);
        if (!source) throw Error("Unknown source");
        const response = await request(feed.url);
        if (response.status < 200 || response.status >= 300) throw Error("HTTP " + response.status);
        updates[feed.id] = parse(response.data, source);
      } catch (error) {
        failed.push(feed.id);
      }
    }));
    if (!Object.keys(updates).length) throw Error("All feeds failed. Saved stories are unchanged.");
    return { news: mergeNews(baseline, updates, now()), failed, updated: Object.keys(updates) };
  }

  // src/discovery.mjs
  var CATEGORIES = [["vulnerability", "Vulnerability"], ["ai-security", "AI security"], ["breach", "Breach"], ["cloud", "Cloud"], ["identity", "Identity"], ["policy", "Policy"], ["malware", "Malware"], ["appsec", "AppSec"], ["ransomware", "Ransomware"], ["other", "Other"]];
  var normalize = (value) => String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  var matches = (text2, query) => String(query || "").trim().split(/\s+/).every((word) => normalize(text2).includes(normalize(word)));
  var tagAlias = { "ai": "ai-security", "ai-security": "ai-security", "identity-access": "identity", "identity": "identity", "iam": "identity", "appsec": "appsec", "application-security": "appsec", "vulnerability": "vulnerability", "vulnerabilities": "vulnerability", "breach": "breach", "cloud": "cloud", "policy": "policy", "malware": "malware", "ransomware": "ransomware" };
  var patterns = { vulnerability: /\b(?:vulnerabilit(?:y|ies)|cve[- ]?\d{4}|zero[- ]?day|security flaw)\b/i, "ai-security": /\b(?:ai security|llm|agentic|prompt injection|artificial intelligence|gen(?:erative)? ai)\b/i, breach: /\b(?:breach|data leak|compromised|data theft)\b/i, cloud: /\b(?:cloud|aws|azure|gcp|kubernetes)\b/i, identity: /\b(?:identity|authentication|oauth|mfa|credential|passkey)\b/i, policy: /\b(?:regulation|policy|legislation|lawmakers|privacy law)\b/i, malware: /\b(?:malware|trojan|infostealer|spyware|worm)\b/i, appsec: /\b(?:appsec|application security|supply chain|dependency attack)\b/i, ransomware: /\b(?:ransomware|ransom|extortion)\b/i };
  function categoriesFor(article) {
    const found = /* @__PURE__ */ new Set();
    for (const tag of article.tags || []) {
      const key = tagAlias[String(tag).toLowerCase()];
      if (key) found.add(key);
    }
    const body = `${article.title || ""} ${article.extract || ""}`;
    for (const [key, regex] of Object.entries(patterns)) if (regex.test(body)) found.add(key);
    return found.size ? [...found] : ["other"];
  }
  function filterNews(articles, { source = "all", categories = [], query = "" } = {}) {
    return articles.filter((a) => (source === "all" || a.source === source) && (!categories.length || categories.some((c) => categoriesFor(a).includes(c))) && matches(`${a.title || ""} ${a.sourceName || ""} ${a.extract || ""}`, query));
  }
  function filterCerts(rows, query = "", domain = "all") {
    return rows.filter((c) => (domain === "all" || c.main_domain === domain) && matches(`${c.acronym || ""} ${c.full_name || ""} ${c.main_domain || ""} ${c.sub_domain || ""}`, query));
  }

  // src/roadmap.mjs
  var asState = (state) => Array.isArray(state) ? { ids: state, done: [] } : { ids: state.ids || [], done: state.done || [] };
  function toggle(state, id) {
    const s2 = asState(state), ids = s2.ids.includes(id) ? s2.ids.filter((x) => x !== id) : [...s2.ids, id];
    return { ids, done: s2.done.filter((x) => ids.includes(x)) };
  }
  function move(state, id, step) {
    const s2 = asState(state), ids = [...s2.ids], from = ids.indexOf(id), to = from + step;
    if (from >= 0 && to >= 0 && to < ids.length) [ids[from], ids[to]] = [ids[to], ids[from]];
    return { ids, done: [...s2.done] };
  }
  function complete(state, id) {
    const s2 = asState(state);
    if (!s2.ids.includes(id)) return s2;
    return { ids: [...s2.ids], done: s2.done.includes(id) ? s2.done.filter((x) => x !== id) : [...s2.done, id] };
  }
  function decodeRoute(saved, legacy, validIds) {
    let parsed;
    try {
      parsed = JSON.parse(saved || legacy || "[]");
    } catch {
      parsed = [];
    }
    const s2 = asState(Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? parsed : []), ids = [...new Set(s2.ids.filter((id) => validIds.has(id)))];
    return { ids, done: [...new Set(s2.done.filter((id) => ids.includes(id)))] };
  }

  // src/article.mjs
  function articleUrl(raw) {
    try {
      const url = new URL(raw);
      return ["http:", "https:"].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  }
  async function openArticle(raw, { native, openNative, openWeb }) {
    const url = articleUrl(raw);
    if (!url) return { ok: false, reason: "invalid-url" };
    try {
      if (native) {
        await openNative(url);
      } else if (!openWeb(url)) {
        return { ok: false, reason: "open-failed" };
      }
      return { ok: true, url };
    } catch {
      return { ok: false, reason: "open-failed" };
    }
  }

  // src/persistence.mjs
  async function saveRoadmap(state, write, status) {
    status("Saving\u2026");
    try {
      await write(state);
      status("Saved automatically on this device.");
      return state;
    } catch (error) {
      status("Could not save roadmap. Try again.");
      throw error;
    }
  }

  // src/app.mjs
  var $ = (id) => document.getElementById(id);
  var seed = window.__NEWS__ || { sources: [], articles: [] };
  var certs = (window.__CERTIFICATIONS__ || []).map((row, index) => ({ ...row, id: `cert-${index}` }));
  var byId = new Map(certs.map((c) => [c.id, c]));
  var domains = { redops: "Offensive security", blueops: "Defensive security", engineer: "Security engineering", network: "Network security", software: "Application security", iam: "Identity and access", mgmt: "Governance", test: "Audit and testing", asset: "Asset and privacy" };
  var news = seed;
  var roadmap = { ids: [], done: [] };
  var current = "news";
  var shown = 45;
  var busy = false;
  var sheetOpener = null;
  var newsFilter = { source: "all", categories: [], query: "" };
  var certDomain = "all";
  var el = (tag, cls, text2) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text2 != null) node.textContent = String(text2);
    return node;
  };
  var date = (value) => Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString() : "Unknown";
  var level = (value) => Number(value) >= 19 ? "Beginner" : Number(value) >= 10 ? "Intermediate" : "Advanced";
  var note = (id, message) => $(id).textContent = message;
  function external(url, label) {
    const a = el("a", "", label);
    try {
      const u2 = new URL(url);
      if (!["https:", "http:"].includes(u2.protocol)) throw Error();
      a.href = u2.href;
      a.rel = "noopener noreferrer";
      a.target = "_blank";
      if (Capacitor.isNativePlatform()) a.onclick = (e) => {
        e.preventDefault();
        Browser2.open({ url: u2.href }).catch(() => {
        });
      };
    } catch {
      a.textContent = "Link unavailable";
    }
    return a;
  }
  function show(name) {
    if (current === name) return;
    current = name;
    for (const key of ["news", "certs", "route"]) {
      $(key + "-view").hidden = key !== name;
      $("tab-" + key).setAttribute("aria-current", key === name ? "page" : "false");
    }
    window.scrollTo(0, 0);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) $(name + "-view").animate([{ opacity: 0.78, transform: "translateY(5px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 145, easing: "cubic-bezier(.22,1,.36,1)" });
  }
  var sheetExit = null;
  function finishSheetClose() {
    if ($("sheet-backdrop").hidden) return;
    $("sheet-backdrop").hidden = true;
    document.body.classList.remove("sheet-open");
    $("sheet-body").replaceChildren();
    $("sheet-actions").replaceChildren();
    sheetOpener?.focus();
    sheetOpener = null;
  }
  function closeSheet() {
    if ($("sheet-backdrop").hidden || sheetExit) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishSheetClose();
      return;
    }
    sheetExit = $("sheet").animate([{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(16px)" }], { duration: 155, easing: "ease-in" });
    sheetExit.onfinish = () => {
      sheetExit = null;
      finishSheetClose();
    };
    sheetExit.oncancel = () => {
      sheetExit = null;
    };
  }
  function openSheet(title, body, actions = []) {
    if (sheetExit) {
      sheetExit.cancel();
      sheetExit = null;
    }
    sheetOpener = document.activeElement;
    $("sheet-title").textContent = title;
    $("sheet-body").replaceChildren(body);
    $("sheet-actions").replaceChildren(...actions);
    $("sheet-backdrop").hidden = false;
    document.body.classList.add("sheet-open");
    $("sheet-close").focus();
  }
  $("sheet-close").onclick = closeSheet;
  $("sheet-backdrop").onclick = (e) => {
    if (e.target === $("sheet-backdrop")) closeSheet();
  };
  document.addEventListener("keydown", (e) => {
    if ($("sheet-backdrop").hidden) return;
    if (e.key === "Escape") {
      closeSheet();
      return;
    }
    if (e.key === "Tab") {
      const nodes = [...$("sheet").querySelectorAll("button:not([disabled]),a[href],input:not([disabled])")];
      if (!nodes.length) return;
      const first = nodes[0], last = nodes.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  function action(text2, onClick, cls = "quiet") {
    const button = el("button", cls, text2);
    button.type = "button";
    button.onclick = onClick;
    return button;
  }
  function choice(type, name, value, label, checked) {
    const line = el("label", "choice"), input = el("input");
    input.type = type;
    input.name = name;
    input.value = value;
    input.checked = checked;
    line.append(input, el("span", "", label));
    return { line, input };
  }
  function openNewsFilters() {
    let source = newsFilter.source, selected = new Set(newsFilter.categories), body = el("div");
    body.append(el("h3", "", "News sources"));
    for (const option of [{ id: "all", name: "All sources" }, ...news.sources || []]) {
      const { line, input } = choice("radio", "news-source", option.id, option.name, source === option.id);
      input.onchange = () => source = option.id;
      body.append(line);
    }
    body.append(el("h3", "", "Categories"));
    for (const [key, label] of CATEGORIES) {
      const { line, input } = choice("checkbox", "news-category", key, label, selected.has(key));
      input.onchange = () => input.checked ? selected.add(key) : selected.delete(key);
      body.append(line);
    }
    openSheet("Filter news", body, [action("Clear", () => {
      newsFilter = { ...newsFilter, source: "all", categories: [] };
      drawNews();
      closeSheet();
    }), action("Show stories", () => {
      newsFilter = { ...newsFilter, source, categories: [...selected] };
      drawNews();
      closeSheet();
    }, "primary")]);
  }
  function openCertFilters() {
    let domain = certDomain, body = el("div");
    for (const key of ["all", ...[...new Set(certs.map((c) => c.main_domain).filter(Boolean))].sort()]) {
      const { line, input } = choice("radio", "cert-domain", key, key === "all" ? "All career areas" : domains[key] || key, domain === key);
      input.onchange = () => domain = key;
      body.append(line);
    }
    openSheet("Career area", body, [action("All areas", () => {
      certDomain = "all";
      shown = 45;
      drawCerts();
      closeSheet();
    }), action("Apply", () => {
      certDomain = domain;
      shown = 45;
      drawCerts();
      closeSheet();
    }, "primary")]);
  }
  async function readStory(row) {
    const result = await openArticle(row.url, { native: Capacitor.isNativePlatform(), openNative: (url) => Browser2.open({ url }), openWeb: (url) => {
      const opened = window.open(url, "_blank");
      if (opened) opened.opener = null;
      return opened;
    } });
    if (!result.ok) note("update-status", result.reason === "invalid-url" ? "The source link is unavailable." : "Could not open the source. Try again when connected.");
  }
  function drawNews() {
    const rows = filterNews(news.articles || [], { ...newsFilter, query: $("news-search").value });
    const f2 = newsFilter.categories.length + (newsFilter.source === "all" ? 0 : 1);
    $("news-filter").textContent = f2 ? `Filters (${f2})` : "Filters";
    note("news-count", `${rows.length} of ${news.articles?.length || 0} stories`);
    const list = $("stories");
    list.replaceChildren();
    if (!rows.length) {
      list.append(el("p", "empty", "No stories match. Change or clear the filters."));
      return;
    }
    for (const row of rows) {
      const card = el("article", "card story"), open = action("", () => readStory(row), "story-open");
      open.setAttribute("aria-label", `Read full article from ${row.sourceName || row.source || "source"}: ${row.title || "Untitled"}`);
      open.append(el("span", "source", `${row.sourceName || row.source || "Source"} \xB7 ${date(row.published)}`), el("span", "story-title", row.title || "Untitled"), el("span", "story-preview", row.extract || "Open the source for the full article."), el("span", "read-label", "Read full article in app"));
      card.append(open);
      list.append(card);
    }
  }
  async function save(next) {
    const saved = await saveRoadmap(next, (data) => Preferences.set({ key: "roadmap-v2", value: JSON.stringify(data) }), (message) => note("route-status", message));
    roadmap = saved;
    drawCerts();
    drawRoadmap();
  }
  function certCard(row) {
    const card = el("article", "card");
    card.append(el("div", "source", `${domains[row.main_domain] || row.main_domain || "Other"} \xB7 ${level(row.skill_row)}`), el("h2", "", row.full_name || row.acronym), el("p", "sub", `${row.acronym || ""} \xB7 ${row.cost_notes || "Confirm price and training with the issuer."}`));
    const buttons = el("div", "card-actions");
    buttons.append(action(roadmap.ids.includes(row.id) ? "Remove from roadmap" : "Add to roadmap", async () => {
      try {
        await save(toggle(roadmap, row.id));
      } catch {
        note("route-status", "Could not save roadmap. Try again.");
      }
    }), action("Details", () => details(row)), external(row.official_url, "Issuer"));
    card.append(buttons);
    return card;
  }
  function drawCerts() {
    const rows = filterCerts(certs, $("cert-search").value, certDomain);
    $("cert-filter").textContent = certDomain === "all" ? "All areas" : domains[certDomain] || certDomain;
    note("cert-count", `${rows.length} of ${certs.length} certifications`);
    $("certs").replaceChildren(...rows.slice(0, shown).map(certCard));
    $("more").hidden = shown >= rows.length;
  }
  function details(row) {
    const body = el("div"), dl = el("dl");
    const fields = [["Acronym", row.acronym], ["Career area", domains[row.main_domain] || row.main_domain], ["Level (roadmap estimate)", level(row.skill_row)], ["Course modules", row.modules_count || row.course_modules], ["Study time", row.study_hours_est ? `${row.study_hours_est} hours` : null], ["Exam duration", row.exam_minutes ? `${row.exam_minutes} minutes` : null], ["Price / training", row.cost_notes || row.listed_cost_usd], ["Exam questions", row.exam_questions], ["Renewal", row.validity_years ? `${row.validity_years} years` : null]];
    for (const [label, value] of fields) {
      const line = el("div", "detail");
      line.append(el("dt", "", label), el("dd", "", value || "Not listed in the catalogue"));
      dl.append(line);
    }
    body.append(el("p", "", row.full_name || row.acronym), dl, el("p", "", "Check current course modules, price and requirements with the issuer before enrolling."));
    openSheet(row.acronym || "Certification details", body, [external(row.official_url, "Official course or exam page")]);
  }
  function drawRoadmap() {
    const list = $("route");
    list.replaceChildren();
    $("count").textContent = roadmap.ids.length;
    if (!roadmap.ids.length) {
      list.append(el("li", "empty", "No courses yet. Add one from Certifications."));
      return;
    }
    roadmap.ids.forEach((id, index) => {
      const row = byId.get(id);
      if (!row) return;
      const li = el("li"), card = action("", () => details(row), "timeline-card");
      card.classList.toggle("done", roadmap.done.includes(id));
      card.setAttribute("aria-label", `Details for ${row.full_name || row.acronym}`);
      card.append(el("span", "step", `Step ${index + 1} \xB7 ${level(row.skill_row)}`), el("strong", "", row.full_name || row.acronym), el("span", "sub", `${row.acronym || ""} \xB7 ${domains[row.main_domain] || row.main_domain || "Other"} \xB7 Tap for details`));
      li.append(card);
      const tools = el("div", "timeline-actions"), done = choice("checkbox", "", id, "Completed", roadmap.done.includes(id));
      done.input.onchange = async () => {
        try {
          await save(complete(roadmap, id));
        } catch {
          drawRoadmap();
          note("route-status", "Could not save completion. Try again.");
        }
      };
      tools.append(done.line);
      for (const [name, step] of [["Up", -1], ["Down", 1]]) {
        const button = action(name, async () => {
          try {
            await save(move(roadmap, id, step));
          } catch {
            note("route-status", "Could not save order. Try again.");
          }
        });
        button.disabled = index + step < 0 || index + step >= roadmap.ids.length;
        tools.append(button);
      }
      tools.append(action("Remove", async () => {
        try {
          await save(toggle(roadmap, id));
        } catch {
          note("route-status", "Could not remove course. Try again.");
        }
      }));
      li.append(tools);
      list.append(li);
    });
  }
  function about() {
    const body = el("div");
    body.append(el("p", "", "Independent cybersecurity intelligence and career planning for aspiring security professionals."), el("p", "", "\xA9 2026 J.M. All rights reserved."));
    const links = el("div", "sheet-links");
    for (const [url, label] of [["mailto:jyotirmay.mondal@efrei.net", "Contact"], ["https://github.com/Jy0t1may", "GitHub"], ["https://www.linkedin.com/in/jyotirmay-mondal", "LinkedIn"]]) {
      if (url.startsWith("mailto:")) {
        const a = el("a", "", label);
        a.href = url;
        links.append(a);
      } else links.append(external(url, label));
    }
    body.append(links);
    openSheet("Security Expedition", body);
  }
  async function loadSaved() {
    try {
      const file = await Filesystem.readFile({ path: "news.json", directory: Directory.Data, encoding: Encoding.UTF8 }), cached = JSON.parse(file.data);
      if (Array.isArray(cached.articles) && Array.isArray(cached.sources) && Date.parse(cached.fetchedAt) > Date.parse(seed.fetchedAt)) news = cached;
    } catch {
    }
    try {
      const v2 = (await Preferences.get({ key: "roadmap-v2" })).value, old = (await Preferences.get({ key: "roadmap-v1" })).value;
      roadmap = decodeRoute(v2, old, new Set(byId.keys()));
      if (!v2 && old && roadmap.ids.length) await Preferences.set({ key: "roadmap-v2", value: JSON.stringify(roadmap) });
    } catch {
    }
    drawNews();
    drawCerts();
    drawRoadmap();
    note("update-status", `Saved feed: ${date(news.fetchedAt)}. Tap to check for updates.`);
  }
  async function update() {
    if (busy) return;
    busy = true;
    $("refresh").disabled = true;
    note("update-status", "Checking feeds\u2026");
    try {
      const result = await refreshFeeds({ baseline: news, feeds: FEEDS, request: (url) => CapacitorHttp.get({ url, responseType: "text", connectTimeout: 12e3, readTimeout: 12e3 }) });
      await Filesystem.writeFile({ path: "news.json", directory: Directory.Data, encoding: Encoding.UTF8, data: JSON.stringify(result.news) });
      news = result.news;
      drawNews();
      note("update-status", `Checked ${result.updated.length} of ${FEEDS.length} feeds at ${date(news.fetchedAt)}.${result.failed.length ? " Unavailable: " + result.failed.join(", ") + ". Previous posts are retained." : ""}`);
    } catch (e) {
      note("update-status", `${e.message || "Update failed"} Saved posts are unchanged.`);
    } finally {
      busy = false;
      $("refresh").disabled = false;
    }
  }
  for (const key of ["news", "certs", "route"]) $("tab-" + key).onclick = () => show(key);
  $("about").onclick = about;
  $("refresh").onclick = update;
  $("news-search").oninput = drawNews;
  $("news-filter").onclick = openNewsFilters;
  $("cert-search").oninput = () => {
    shown = 45;
    drawCerts();
  };
  $("cert-filter").onclick = openCertFilters;
  $("more").onclick = () => {
    shown += 45;
    drawCerts();
  };
  if (Capacitor.isNativePlatform()) {
    SystemBars.show().catch(() => {
    });
    SystemBars.setStyle({ style: SystemBarsStyle.Dark }).catch(() => {
    });
  }
  loadSaved();
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
