;(function(){
   var prim = Reruby.Prim = {}
   prim.allocString = function(str, g) {
      var addr = allocate(intArrayFromString(str), 'i8', ALLOC_NORMAL);
      if(g){
         return g(addr);
      } 
     return addr;
   };

   prim._addfunc = function(f) {
        return FUNCTION_TABLE.push(f) - 1;
   };

  prim._strFromPtr = Pointer_stringify;

  prim._rubyStrValue = function(val) {
    var ptr = allocate([val,0,0,0], ['i32',0,0,0], ALLOC_NORMAL);
    var str = Pointer_stringify(_rb_string_value_ptr(ptr));
    _free(ptr);
    return str;
  };

   prim.def = function(obj, name, f, arity) {
      Reruby.Prim.allocString(name, function(name){
          var id = Reruby.Prim._addfunc(f);
          console.log(f);
          _rb_define_method(obj, name, id, arity || -1);
      });
   };

   prim.defs = function(obj, name, f, arity) {
      Reruby.Prim.allocString(name, function(name){
          var id = Reruby.Prim._addfunc(f);
          _rb_define_singleton_method(obj, name, id, arity || -1);
      });
   };

   prim.defm = function(obj, name, f, arity) {
      Reruby.Prim.allocString(name, function(name){
          var id = Reruby.Prim._addfunc(f);
          _rb_define_module_function(obj, name, id, arity || -1);
      });
   };

   prim.defkernel = function(name, f, arity) {
      this.def(Ruby.eval("Kernel"), name, f, arity || -1);
   };

   prim.defModule = function(name){
      return Reruby.Prim.allocString(name, function(name){
         return _rb_define_module(name);
      });
   };

   prim.makePrimFunc = function(a, b){
      return function(f){
        return function(){
           var args = [].map.call(arguments, function(x, i){  
               return a[i]["in"](x);
           }).filter(function(x){ return x !== undefined; });
           return b["out"](f.apply(null, args));
        };
      };
   };

   prim.strIn    = prim._rubyStrValue;
   prim.strOut  = function(str){
      return prim.allocString((str || 'undefined').toString(), function(str){
        return _rb_str_new2(str);
      });
   };
   prim.fixIn = _rb_num2long;
   prim.fixOut = _rb_ll2inum;
   prim.str = {  "in": prim.strIn, "out": prim.strOut };
   prim.fix = {  "in": prim.fixIn, "out": prim.fixOut };
   prim.id  = { "in": function(a){return a;}, "out": function(a){return a;}};
   prim.ignore = {"in": function(a){}, "out": function(a){return 4;}};
   prim.Eval = {};
   prim.Eval.eval = eval;
   prim.constant = function(a){
     return {
        "in": function(){return a;},
        "out": function(){return a;}
     };
   };
   prim.initialize = function(){
     prim.Console = prim.defModule("Console");
     prim.defm(prim.Console, "log", prim.makePrimFunc([prim.id, prim.str], prim.id)(function(self, str){
       console.log(str);
       return self;
     }), 1);

     prim.JS = prim.defModule("JS");
     prim.defm(prim.JS, "eval", prim.makePrimFunc([prim.ignore, prim.str], prim.str)(function(str){
         return prim.Eval.eval(str);
     }), 1);
   }


})(this);