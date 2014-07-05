import os
import json

import webapp2
import jinja2

from google.appengine.ext import ndb
from register import Device, DEFAULT_MAP_NAME, map_key

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)

class MapPage(webapp2.RequestHandler):
    def get(self):
        map_name = DEFAULT_MAP_NAME

        devices = Device.query(ancestor=map_key(map_name)).order(Device.clientId).fetch(200)
        rendered_devices = [{"id": x.key.integer_id(), "ip": x.ip, "x": i, "y": 0} for i,x in enumerate(devices)]
        template_values = {
            "registered_devices": rendered_devices,
        }
        if True:  # self.request.headers.get('Accept') == 'text/json':
            self.response.content_type = "text/json";
            self.response.write(json.dumps(rendered_devices))
        else:
            template = JINJA_ENVIRONMENT.get_template('registration.html')
            self.response.write(template.render(template_values))

application = webapp2.WSGIApplication([
    ('/map', MapPage),
], debug=True)
