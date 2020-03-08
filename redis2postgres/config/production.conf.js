exports.config = {
    sscArr:[
        {host:'push-handler-win1.frontend',port:'6379',instanceId:'PRODUCTION_1'},
        {host:'127.0.0.1',port:'6379',instanceId:'PRODUCTION_1'},
        ],
    postgre: {
        host:'127.0.0.1',
        port:'5432',
        db:'node'
    }
};