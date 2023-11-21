# React-Typescript-Template

## 开发

```bash
# 开发
pnpm dev

# 构建
pnpm build
```

## 项目选型

### 样式

样式采用tailwind + module CSS

样式的命名规范使用SMACSS

* Base
* Layout
* Module
* State
* Theme

tailwind在使用时注意行内的使用，复用性高的封装为一个选择器

### 网络请求

#### useSWR

react中的一个请求库，可以利用接口缓存优化性能

#### fetch

原生提供的功能

### 组件

主要依托于headlessUI，在增加新的组件时可以封装成对应的样式

### icon

使用heroicon

### 路径

使用路径别名@  
components下为组件  
pages下为各个页面  
styles下为样式  
可以设置utils提供一些辅助函数  

### 工具链

建议安装prettier与eslint插件，以便格式化文件，也可使用pnpm lint来格式化
