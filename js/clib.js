(function (window) {
  class CLib {
    constructor(env) {
      return (async () => {
        this.env = env;
        this.stdout = await VFS.open("/dev/stdout");
        this.stdin = await VFS.open("/dev/stdin");
        return this;
      })();
    }

    _getFullPath(path) {
      if (path[0] != "/") {
        return this.env.WORKING_DIRECTORY + path;
      }
      return path;
    }

    fopen(path, newFlag) {
      return VFS.open(this._getFullPath(path), newFlag);
    }

    puts(cont) {
      return this.stdout.writeAll(cont);
    }

    /* POSIX */
    async chdir(path) {
      let newPath = VFS.resolve(this._getFullPath(path));
      let file = await VFS.open(newPath);
      if (file == null) throw new Error('No such file or directory');
      if (!file.isDirectory()) throw new Error('Is not a directory');
      this.env.WORKING_DIRECTORY = newPath + (newPath.endsWith('/') ? '' : '/');
    }

    async stat(path) {
      var f = await VFS.lookup(this._getFullPath(path));
      if (f == null) {
        return null;
      }
      var opened = f.open();
      return {
        type: f.type,
        exec: opened.canExec()
      };
    }

    async exec(cmd, args) {
      if (cmd[0] != "/") {
        var onceNonnull = false;
        var pathSplit = this.env.PATH.split(";");
        if (cmd.indexOf("/") != -1) {
          pathSplit.push(this.env.WORKING_DIRECTORY);
        }
        for (var i = 0; i < pathSplit.length; i++) {
          var p = pathSplit[i];
          if (p[0] != "/") {
            p = this.env.WORKING_DIRECTORY + p;
          }
          var file = await VFS.open(p + "/" + cmd);
          if (file == null) {
            continue;
          }
          if (!file.canExec()) {
            if (file.isDirectory()) {
              onceNonnull = "Is a directory";
            } else {
              onceNonnull = "Permission denied"
            }
            continue;
          }
          return file.exec(this.env, args);
        }
        if (onceNonnull) {
          throw onceNonnull;
        } else {
          throw "command not found";
        }
      }
      var file = await VFS.open(cmd);
      if (file == null) {
        throw "command not found";
      }
      if (!file.canExec()) {
        if (file.isDirectory()) {
          throw "Is a directory";
        } else {
          throw "Permission denied"
        }
      }
      return file.exec(this.env, args);
    }
  }

  window.CLib = CLib;
})(window);

(function (CLib) {
  CLib.prototype.historyNextLine = async function (specKey) {
    if (!this.HNLHistory) {
      this.HNLHistory = [];
    }
    var history = this.HNLHistory;
    var id = history.length;

    let promise = this.stdin.read(2048, 'string');

    document.querySelector('#inputbox').addEventListener('keydown', function (e) {
      var key;
      switch (e.which) {
        case 38:
          key = "up";
          break;
        case 40:
          key = "down";
          break;
        case 9:
          key = "tab";
          break;
        default:
          return;
      }
      let element = document.querySelector('#inputbox');
      if (key == "up") {
        if (id == 0) {
          return;
        }
        if (id == history.length) {
          inputBackup = element.value;
        }
        id--;
        element.value = history[id];
      } else if (key == "down") {
        if (id == history.length) {
          return;
        }
        id++;
        if (id == history.length) {
          element.value = inputBackup;
        } else {
          element.value = history[id];
        }
      } else {
        specKey && specKey(key, element);
      }
      e.preventDefault();
    });

    let [, val] = await promise;
    if (history[history.length - 1] != val) {
      history.push(val);
      id = history.length;
      if (history.length > 20) {
        history.splice(0, history.length - 20);
        id = 20;
      }
    }
    return val;
  }
})(CLib);
