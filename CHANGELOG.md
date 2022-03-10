# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.5.1](https://github.com/lzwme/simple-mock/compare/v1.5.0...v1.5.1) (2022-03-10)


### Bug Fixes

* 修复 delete require.cache 导致的内存泄漏问题 ([750af39](https://github.com/lzwme/simple-mock/commit/750af39e36ebf28951dbbd884c38eb246939bd18))

## [1.5.0](https://github.com/lzwme/simple-mock/compare/v1.4.2...v1.5.0) (2021-11-29)


### Features

* 移除 chalk 依赖，改用自定义的 color 实现 ([b6292db](https://github.com/lzwme/simple-mock/commit/b6292dbd6424dc51eb18967e12e9b103006b75c4))


### Bug Fixes

* ts-node 应为开发模式下依赖 ([4f97fea](https://github.com/lzwme/simple-mock/commit/4f97fea0a8b3f9d4afd63e72a35b4f3fc9ebce91))

### [1.4.2](https://github.com/lzwme/simple-mock/compare/v1.4.1...v1.4.2) (2021-04-26)


### Bug Fixes

* 修正 content-encoding 入参为 decoded 时会打印 error 的问题 ([d42f8c2](https://github.com/lzwme/simple-mock/commit/d42f8c24afa6edc452b40510cf820743f2220e3e))

### [1.4.1](https://github.com/lzwme/simple-mock/compare/v1.4.0...v1.4.1) (2021-04-26)


### Bug Fixes

* 修复 content-encoding 为空时 save-api 保存数据后发送数据重复的问题([#2](https://github.com/lzwme/simple-mock/issues/2)) ([b6ae169](https://github.com/lzwme/simple-mock/commit/b6ae169699d90f02cde1ab54844d3c5fd8ca7b8e))

## 1.4.0 (2021-02-08)


### Features

* 增加 http 模式支持自动保存无 content-encoding 压缩的数据 ([4c032a7](https://github.com/lzwme/simple-mock/commit/4c032a72988ec634f1fa5439cfcb0dea746187c0))
