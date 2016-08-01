Meteor.methods({
  auth( pw ){
    if(pw == 'spinach1'){
      return true;
    }else{
      return false;
    }
  }
});
