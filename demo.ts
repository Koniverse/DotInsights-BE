function a() {
  return new Promise((resolve, reject) => {
    setTimeout(() => { console.log('zz'); }, 1000);
    resolve('a');
  });
}
a();
console.log('x');
