## To build and publish this package

In the terminal:

```
npm run build
npm login
npm publish --access=public
```

Note:
             
* Typing `npm run build` will create the `lib` folder with the compiled code.

* `--access=public` is needed for scoped packages (@clarkio/modern-npm-package) as they're private by default.

See:

* https://blog.npmjs.org/post/165769683050/publishing-what-you-mean-to-publish.html
* https://snyk.io/pt-BR/blog/best-practices-create-modern-npm-package/
