const express = require('express');
const session = require('express-session');
const app = express();
var path = require('path');
var os = require('os');
var fs    = require('fs');
const { match } = require('assert');
var uuid = require('uuid');
const port = 3020 ;
const  resolver = require('path').resolve

/*
app.get('/', (req, res) => {
  res.send('<h3> IIIF AUTH SERVER EXPRESS </h3>');
})*/


app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))



APP_PATH = path.dirname('file.html');
MEDIA_ROOT = path.join(APP_PATH, 'media');
AUTH_POLICY = null;
with(policy_data = path.join(MEDIA_ROOT, 'policy.json')){
    
    AUTH_POLICY = JSON.stringify(policy_data)
}
console.log("--------------"+MEDIA_ROOT+"----------------"+APP_PATH)

var func =  () => {
    session.permanent = true ;

    session.modified = true;
    
    console.log('func');
    next();
};

var resolve =  (identifier) =>  {
    
    console.log('resolve');
    next();
    return os.path.join(MEDIA_ROOT, identifier);
    
};

app.get('/', (req,res) => {
    res.send('<h3> IIIF AUTH SERVER EXPRESS </h3>');
    var files = fs.readdir(MEDIA_ROOT,'utf8', function (err, data) {console.log("read file ")});
    /*manifests = sorted(''.join(f.split('.')[:-2]) for f in files if f.endswith('manifest.json'))*/
    //return render_template('index.html', images=get_image_summaries(), manifests=manifests)
    //res.render('file')
    
})


var get_image_summaries =  () =>  {
    console.log('resolve');

    images = get_image_list();
    //images_as_dicts = [img._asdict() for img in images]
    for (const img in images_as_dicts){
        
        img["display"] = img["id"];
        if (img['type'] ==! 'ImageService2'){
            policy = AUTH_POLICY[img['id']]
            assert_auth_services(img, policy, img['id'], True)
            img['partOf'] = url_for('manifest', identifier=img["id"].slice(-4)[0] , _external=True)
            img['type'] = get_dc_type(img["id"])
            img['id'] = url_for('resource_request', identifier=img['id'], _external=True)

        }

    }

    
    
    return os.path.join(MEDIA_ROOT, identifier);
    
};


var get_dc_type =  (filename) => { 

    extension = filename.split('.')[-1];

    if(extension == "mp4")
        return "Video" ;
    else if  (extension == "mp3" || extension == "mpd")
        return "Audio" ;
    else if  (extension == "pdf")
        return "Text"
    else if (extension == "gltf")
        return "PhysicalObject" ;

    
    return "Unknown"
}


app.route('/index.json', () => {

    return make_acao_response(jsonify(get_image_summaries()), 200, True);

})


var get_image_list =  () => { 

    var files = list_files(MEDIA_ROOT)
    //var names = sorted(f for f in files if not f.endswith('json') and not f.startswith('manifest'))
    image_nt = namedtuple('Image', ['id', 'label', 'type', 'format'])
    images = [ image_nt(
        name, 
        AUTH_POLICY[name]['label'], 
        AUTH_POLICY[name].get('type', 'ImageService2'),
        AUTH_POLICY[name].get('format', None)
    ) ] //for(const name in names){}

    return images;
}


var list_files = (path) => {
    
    for( file in os.listdir(path)){
        if(os.path.isfile(os.path.join(path, file))){
            return file; //il faut faire "yield" au lieu de return
        }
    }
}


var make_manifest = (identifier) => {

        new_manifest = null
        while(source_manifest = fs.open(os.path.join(MEDIA_ROOT,identifier+'.manifest.json'))){


                new_manifest = json.load(source_manifest)
                manifest_id = "%smanifest/%s" % (request.url_root, identifier)

                canvases = new_manifest.get("items", None)
                if(canvases =! null ){
                        new_manifest['id'] = manifest_id
                }
                else {
                    new_manifest['@id'] = manifest_id ;
                    new_manifest['sequences'][0]['@id'] = (
                        "%smanifest/%s/sequence" % (request.url_root, identifier))
                    canvases = new_manifest['sequences'][0]['canvases']
                }

                rendering = new_manifest.get("rendering", [])
                if(rendering.length > 0){

                    resource_identifier = rendering[0]['id']
                    policy = AUTH_POLICY[resource_identifier]
                    assert_auth_services(rendering[0], policy, resource_identifier, True)
                    rendering[0]['id'] = "%sresources/%s" % (request.url_root, resource_identifier)
                } else {
                    for(const canvas in canvases){
                        var images = canvas.get('image',[])
                        if(images.length > 0){
                            var image = canvas['images'][0]['resource']
                            var image_identifier = image['@id']
                            if(!image_identifier.startswith("http")){
                                canvas['images'][0]['@id'] = "%simage-annos/%s" % (request.url_root, image_identifier)
                                image['service'] = {
                                    "@context" : iiifauth.terms.CONTEXT_IMAGE,
                                    "@id" : "%simg/%s" % (request.url_root, image_identifier),
                                    "profile" : iiifauth.terms.PROFILE_IMAGE
                                }
                                image['@id'] = "%s/full/full/0/default.jpg" % image['service']['@id']
                            }
                        }
                        var items = canvas.get('items', [])
                        if(items.length > 0){
                            var anno = canvas['items'][0]['items'][0]
                            var resource = anno['body']
                            var resource_identifier = resource['id']
                            if(!resource_identifier.startswith("http")){
                                anno['id'] = "%sresource-annos/%s" % (request.url_root, resource_identifier)
                                var policy = AUTH_POLICY[resource_identifier]
                                assert_auth_services(resource, policy, resource_identifier, True)
                                resource['id'] = "%sresources/%s" % (request.url_root, resource_identifier)
                            }
                        }
                    }
        }

        }
        


        return new_manifest


}


var manifest = app.get('/manifest/:identifier', (identifier) =>{
    
    var {ident2} = req.params;
    console.log("ide2 : "+ ident2)
    new_manifest = make_manifest(identifier);
    return make_acao_response(jsonify(new_manifest), 200, True)

})



var  make_acao_response = (res, response_object, status=null, cache=None, origin=null) => {

        /*  --- We're handling CORS directly for clarity --- */
        
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'true');
        if(cache == None)
                res.header('Access-Control-Allow-Headers', 'no-cache, no-store, must-revalidate');
        else
                res.header('Access-Control-Allow-Headers', 'public, max-age=120');

} 


var preflight = () => {
    var resp = make_acao_response('', 200)
    resp.headers('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, HEAD')
    resp.headers('Access-Control-Allow-Headers', 'Authorization')
    return resp
}

var get_patten_name = (service) => {

    return service['profile'].split('/')[-1];

}

var assert_auth_services = (info, policy,  identifier, prezi3=false) => {

        var original_policy = policy;
        var degraded_for = policy.get('degraded_for', None);
        if(degraded_for){
            identifier = degraded_for;
            policy = AUTH_POLICY[degraded_for];
        }
        var service = policy.get('auth_services',[])

        for(service in services){
            if(!prezi3){
                service['@context'] = iiifauth.terms.CONTEXT_AUTH;
            }
            pattern = get_pattern_name(service)
            identifier_slug = 'shared';
            if(policy.get('shared', False)){}
            else {identifier}

            service['@id'] = "%sauth/cookie/%s/%s" % (request.url_root, pattern, identifier_slug)
            service['service'] = [
                {
                    "@id" : "%sauth/token/%s/%s" % (request.url_root, pattern, identifier_slug),
                    "profile" : iiifauth.terms.PROFILE_TOKEN
                },
                {
                    "@id" : "%sauth/logout/%s/%s" % (request.url_root, pattern, identifier_slug),
                    "profile" : iiifauth.terms.PROFILE_LOGOUT,
                    "label": "log out"
                }
            ]

            if(prezi3){
                service["@type"] = "AuthCookieService1"
                service['service'][0]['@type'] = "AuthTokenService1"
                service['service'][1]['@type'] = "AuthLogoutService1"
            }
            if(policy.get("explicit_probe", False)){
                service['service'].append({
                    "@id": "%sprobe/%s" % (request.url_root, identifier),
                    "@type": "AuthProbeService1",
                    "profile" : iiifauth.terms.PROFILE_PROBE, 
                })
            }
        
        }

        if(service.length > 0){

            if(prezi3 || service.length > 1){
                info['service'] = services;
            }
            else {
                info['service'] = services[0];
            }
        }
        max_width = original_policy.get('maxWidth', None)
        if(max_width =! null){
            info['profile'].append({
                "maxWidth": max_width
            })
        }



}

var authorise_prob_request = (identifier) => {

    var policy = AUTH_POLICY[identifier]
    if(policy.get('open')){
        console.log('is open, no auth required'+identifier)
        return true
    }

    service_id = null ;


    if(match){

        var token = match.group(1);
        console.log('token found : '+ token)
        //TODO TODO TODO TODO TODO TODO
    }



}


var get_session_id = () => {
    return session.get('session_id',null)
}

var authorise_resource_request = (identifier) => {

    policy = AUTH_POLICY[identifier]
    if(policy.get('open')){
        return true
    } 

    services = policy.get('auth_services', [])
    identifier_slug = 'shared'
    if(policy.get('shared', False)){} else identifier

    for(service in services){
        pattern = get_pattern_name(service)
        test_service_id = get_service_id(pattern, identifier_slug)
        if(session.get(test_service_id, null)) {
            return true;
        }
    }
    return false;

} 

var image_id = app.get('/img/:identifier',(req,res,identifier) => { 

    //console.log("identifier : "+req.param);
    var resp = res.redirect(url_for('image_info', identifier=identifier), code=303)
    return make_acao_response(resp); 

});

var image_info = app.get('/img/:identifier/info.json',(req,identifier) => {    

    console.log("methode : " + req.methode  )
    if(req.methode == 'OPTIONS'){
        console.log("here")
        console.log('CORS preflight request for '+identifier)
        return preflight()
    }
    
    console.log('info.json request for' + identifier)
    policy = AUTH_POLICY[identifier]
    uri = req.url_root+"img"+identifier
    info = web.info(uri, resolve(identifier))
    assert_auth_services(info, policy, identifier)

    if(authorise_probe_request(identifier)){
        return make_acao_response(jsonify(info), 200);
    }
    console.log('The user is not authed for this resource')
    degraded_version = policy.get("degraded", null)
    if(degraded_version){
        redirect_to = request.url_root+"img/"+degraded_version+"/info.json" ;
        console.log("a degraded version is available at : "+ redirect_to)
        return make_acao_response(redirect(redirect_to, code=302))
    }

    return make_acao_response(jsonify(info), 401)

});

var image_api_request = app.route('/img/<identifier>/<region>/<size>/<rotation>/<quality>.<fmt>',(identifier,kwargs) =>  {    

    if(authorise_resource_request(identifier)){
        var params = web.Parse.params(identifier, kwargs)
        policy = AUTH_POLICY[identifier]
        max_width = policy.get('maxWidth', None)
        if(max_width =!  null){
            var full_w = policy['width']
            var full_h = policy['height']
            req_w, req_h = get_actual_dimensions(
                params.get('region'),
                params.get('size'),
                full_w,
                full_h)
            if(req_w > max_width || req_h > max_width){
                return make_response("Requested size too large, maxWidth is " + str(max_width))
            }    
        }
        var tile = iiif.IIIF.render(resolve(identifier), params)
        return send_file(tile, mimetype=tile.mime)
    }
    return make_response("Not authorised", 401)



});


var get_actual_dimensions = (region,size,full_w,full_h) => {


    if (region.get('full',false)){
        r_width = full_w
        r_height = full_h
    }
    else {
        r_width = region['w']
        r_height = region['h']
    }

    if(size.get('full', False)){
        width = r_width
        height = r_height
    } 
    else {
        width = size['w']
        height = size['h']
    }

    if(width && !height){
        height = int(round(r_height * float(width / float(r_width))))
    }
    else if(!width && height){
        width = int(round(float(r_width) * float(height / float(r_height))))
    }

    console.log("width : " + width + "height : " + height)
    return width, height;



}


var cookie_service = app.route('/auth/cookie/<pattern>/<identifier>',(pattern,identifier)  => {  

    origin = request.args.get('origin')
    if(!origin){
        return make_response("error - no origin supplied", 400)
    }
    if(pattern == "login"){
        return handle_login(pattern, identifier, origin, 'login.html')
    }

    else if(pattern == "clickthrough"){
        return successful_login(pattern, identifier, origin)
    }
    else if(pattern == "kiosk"){
        return successful_login(pattern, identifier, origin)
        
    }
    else if(pattern == "external"){
        return make_response("Error - a client should not call an external auth cookie service @id", 400)
    }





})  




var handle_login = (pattern,identifier,origin,template) => {

    if(authorise_resource_request(identifier)){
        return successful_login(pattern, identifier, origin)
    }
    var error = null 
    if(identifier =! 'shared'){
        policy = AUTH_POLICY.get(identifier, null)
        if(!policy){
            error = "No cookie service for " + identifier ;
        }
    }
    if(!error && request.method == 'POST'){
        if(request.form['username'] != 'username'){error = 'invalid username'}
        else if(request.form['password'] != 'password'){error = 'invalid password'}
        else {return successful_login(pattern, identifier, origin)}

    }
    return render_template(template, error=error)

}


var successful_login = (pattern,identifier,origin) => {
    resp = redirect(url_for('post_login'))
    make_session(pattern, identifier, origin)
    return resp
}


var external = app.route('/external-cookie/:identifier',(identifier) =>  {   
        return handle_login('external', identifier, null, 'external.html');
} );

var make_session = (pattern,identifier,origin) => {

    var session_id = get_session_id();
    if(session_id =! null) {
        session_id = uuid.v4();
        session['session_id'] = session_id; //je pense qu'il faut mettre id au lieu de session_id
    }

    console.log('this user session is :' + session_id)

    if(origin =! null){
        origin = "[No origin supplied]";
    }
    service_id = get_service_id(pattern, identifier);
    console.log('user authed for service' + service_id)
    console.log('origin is : ' + origin)

    session[service_id] = true
    token = uuid.v4();
    console.log('minted token : ' + token)
    console.log('session id : ' + session_id)

    /* database = get_db()
    database.execute("delete from tokens where session_id=? and service_id=?",[session_id, service_id])
    database.commit()
    database.execute("insert into tokens (session_id, service_id, token, origin, created) values (?, ?, ?, ?, datetime('now'))",[session_id, service_id, token, origin])
    database.commit() */


}


var get_service_id = (pattern,identifier) => {
    
    return "cookie/"+pattern+"/"+identifier;
}

var split_key = (key) => {
    var parts = key.split('/')
    return { "pattern" : parts[1], "identifier": parts[2] }
}

var post_login = app.route('/auth/post_login', () => {  
    console('here we go')  
    return render_template('post_login.html')
})

var token_service = app.route('/auth/token/:pattern/:identifier',(req,pattern,identifier) => {   

    origin = req.args.get('origin');
    message_id = request.args.get('messageId')
    service_id = get_service_id(pattern, identifier)
    session_id = get_session_id()
    token_object = null
    db_token = null

    console.log('looking for token for session '+session_id+' service '+service_id+' pattern '+pattern);
    if(session_id){
        db_token = query_db('select * from tokens where session_id=? and service_id=?',[session_id, service_id], one=true)
    }
    if(db_token){
        console.log('found token : '+db_token['token'])
        session_origin = db_token['origin']
        if(origin == session_origin || pattern == 'external'){
            token_object = {
                "accessToken": db_token['token'],
                "expiresIn": 600
            }
        } else {
            console.log('session origin was '+session_origin)
            token_object = {
                "error": "invalidOrigin",
                "description": "Not the origin supplied at login"
            }
        }
    } 
    
    else {
        token_object = {
            "error": "missingCredentials",
            "description": "to be filled out"
        }
    }
    
    if(message_id){
            token_object['messageId'] = message_id
            return render_template('token.html', token_object=json.dumps(token_object), origin=origin)
    }


    return jsonify(token_object)
    
});


var logout_service = (pattern,identifier) =>  app.route('/auth/logout/:pattern/:identifier',() => {   

    service_id = get_service_id(pattern,identifier)
    /*session.pop('service_id') //doute sur session.pop verifier apres
    database = get_db()
    database.execute('delete from tokens where session_id=? and service_id=?',[get_session_id(), service_id])
    database.commit()*/
    return "You are now logged out"
})

var view_session_tokens = app.route('/sessiontokens',() => {    

    /* database = get_db()
    database.execute("delete from tokens where created < date('now','-1 day')")
    database.commit();
    session_tokens = query_db('select * from tokens order by created desc') */
    return render_template('session_tokens.html', session_tokens = session_tokens, user_session = get_session_id())

})

var kill_session = app.route('/killsessions',() => {    

    session_id = get_session_id()
    if(session_id){
        database = get_db()
        database.execute("delete from tokens where session_id=?", [session_id])
        database.commit()
        for(const key in list(session.keys())){
            if(key =! 'session_id'){
                session.pop(key, null)
            }
        }
    }
    return redirect(url_for('view_session_tokens'))

}) 


var connect_db = () => {
    var conn = sqlite3.connect(app.database)
    conn.row_factory = sqlite3.Row
    return conn
}

var get_db = () => {
    if(!('sqlite_db' in g)){
        g.sqlite_db = connect_db()
    }
    return g.sqlite_db
}

var query_db = (query,args,one=false) => {
    none = null;
    var cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return   { if(rv){rv[0]} }  //à reverifier aprés  
    }


var close_db = (error) => {
    if('sqlite_db' in g){
        g.sqlite_db.close()
    }
}

var init_db = () => {
    db = get_db
    while(f = app.open_resource('schema.sql', mode='r')){
        db.cursor().executescript(f.read())
    }
    db.commit()
}

var initdb_command = () => {
    init_db()
    console.log('Initialized the database.')
}


var resource_request = app.get('/resources/:identifier', (req,identifier)  => {   

    console.log("Methode : " + req.methode)
    if(request.method == 'OPTIONS'){
        console.log('CORS preflight request for', identifier)
        return preflight()
    }

    if(request.method == 'HEAD'){
        if(authorise_probe_request(identifier)){
            return make_acao_response('', 200)
        }
        return make_acao_response('', 401)
    }

    policy = AUTH_POLICY[identifier]
    if(authorise_resource_request(identifier)){
        resp = send_file(resolve(identifier))
        required_session_origin = null
        if(policy.get("format", null) == "application/dash+xml"){
            session_id = get_session_id()
            db_token = null
            if(session_id){
                //db_token = query_db('select * from tokens where session_id=?', [session_id], one=True)
            }
            if(db_token){
                console.log("found token "+db_token['token'])
                required_session_origin = db_token['origin']
            }
            else {
                required_session_origin = request.headers.get('Origin', null)
            }
        }
        return make_acao_response(resp, origin=required_session_origin)
    }
    else {
        degraded_version = policy.get('degraded', null)
        if(degraded_version){
            content_location = req.url_root+"sresources/"+degraded_version
            console.log('a degraded version is available at ' + content_location)
            return redirect(content_location, code=302)
        }
    }
    return make_response("Not authorised", 401)

}) 
 

var resource_request_fragment = app.get('/resources/:manifest_identifier/:fragment',(manifest_identifier,fragment) => {   

    id_parts = manifest_identifier.split(".token.")
    if(id_parts.length == 1){
        id_parts.append(null)
    }
    identifier, token = tuple(id_parts)
    reconstructed_path = os.path.join(manifest_identifier, fragment)

    return make_acao_response(send_file(resolve(reconstructed_path)))

})  

var probe = app.get('/probe/<identifier>', (req,identifier) => {    

    if(request.method == 'OPTIONS'){
        return preflight()
    }
    policy = AUTH_POLICY[identifier]
    probe_body = {
        "contentLocation": "%sresources/%s" % (request.url_root, identifier),
        "label": "Probe service for " + identifier
    }
    http_status = 200
    if(!authorise_probe_request(identifier)){
        console.log('The user is not authed for the resource being probed via this service')
        degraded_version = policy.get('degraded', null)
        if(degraded_version){
            probe_body["contentLocation"] = "%sresources/%s" % (request.url_root, degraded_version)
        }
        else {
            http_status = 401
        }
    }
    return make_acao_response(jsonify(probe_body), http_status)

})






app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
























