
FlowRouter.route('/', {
    action: function(){
        BlazeLayout.render("ats2", {

        })
    },
});
FlowRouter.route('/bgb', {
    action: function(){
        BlazeLayout.render("bgb", {

        })
    },
});

FlowRouter.route('/bp', {
    action: function(){
        BlazeLayout.render("bp", {

        })
    },
});


FlowRouter.route('/2016', {
    action: function(){
        BlazeLayout.render("pipeline2016", {

        })
    },
});
