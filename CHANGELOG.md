# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.4.2](https://github.com/lzwme/simple-mock/compare/v1.4.1...v1.4.2) (2021-04-26)


### Bug Fixes

* 修正 content-encoding 入参为 decoded 时会打印 error 的问题 ([d42f8c2](https://github.com/lzwme/simple-mock/commit/d42f8c24afa6edc452b40510cf820743f2220e3e))

### [1.4.1](https://github.com/lzwme/simple-mock/compare/v1.4.0...v1.4.1) (2021-04-26)


### Bug Fixes

* 修复 content-encoding 为空时 save-api 保存数据后发送数据重复的问题([#2](https://github.com/lzwme/simple-mock/issues/2)) ([b6ae169](https://github.com/lzwme/simple-mock/commit/b6ae169699d90f02cde1ab54844d3c5fd8ca7b8e))

## 1.4.0 (2021-02-08)


### Features

* 增加 http 模式支持自动保存无 content-encoding 压缩的数据 ([4c032a7](https://github.com/lzwme/simple-mock/commit/4c032a72988ec634f1fa5439cfcb0dea746187c0))
