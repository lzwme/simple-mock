import fs from 'fs';
import path from 'path';

const utilsDir = {
  /**
   * 生成一个深度的目录
   * @param  {String} dir 目录路径
   * @return {void}
   */
  mkDir: (dir: string) => {
    // 目录已存在
    if (!dir || (fs.existsSync(dir) && fs.statSync(dir).isDirectory())) return;

    dir = path.normalize(dir);

    try {
      fs.mkdirSync(dir, { recursive: true });
      return dir;
    } catch (err) {
      const dirList = [];
      let len;

      dir
        .replace(/\\/g, '/')
        .split('/')
        .forEach((name) => {
          len = dirList.length;
          dirList.push((len ? dirList[len - 1] + '/' : '') + name);
        });

      dirList.forEach((pathName) => {
        if (!pathName) return;
        // console.log(pathName)
        // 不存在或者不是一个目录
        if (!fs.existsSync(pathName) || !fs.statSync(pathName).isDirectory()) {
          try {
            fs.mkdirSync(pathName);
          } catch (err) {
            console.log('目录创建失败：', pathName);
            console.log(err);
          }
        }
      });

      return dirList[dirList.length - 1];
    }
  },
  /**
   * 删除指定目录及目录下的所有文件
   * @param  {String}             pathName 要清空的目录
   * @param  {String|RegExp} ext  只删除指定后缀的文件
   * @return {Number}             删除的文件数目
   */
  delDir: (pathName: string, ext?: string | RegExp) => {
    // 不存在
    if (!fs.existsSync(pathName)) {
      return 0;
    }

    // 是文件，删除
    if (fs.statSync(pathName).isFile()) {
      fs.unlinkSync(pathName);
      return 1;
    }

    // 是目录
    let files = fs.readdirSync(pathName);
    let curPath;
    let count = 0;

    // 空目录，移除它
    if (!files.length) {
      fs.rmdirSync(pathName);
      return 0;
    }

    // 转换为正则
    if (ext && typeof ext === 'string') {
      ext = new RegExp(ext + '$');
    }

    files.forEach((file /*, index*/) => {
      curPath = pathName + '/' + file;

      if (fs.statSync(curPath).isDirectory()) {
        count += utilsDir.delDir(curPath, ext);
      } else if (!(ext instanceof RegExp) || ext.test(curPath)) {
        fs.unlinkSync(curPath);
        count++;
      }
    });

    // 不按后缀方式删除，移除空目录
    files = fs.readdirSync(pathName).filter((d) => d && !['..'].includes(d));

    if (!files.length) {
      fs.rmdirSync(pathName);
    }

    return count;
  },
};

export default utilsDir;
