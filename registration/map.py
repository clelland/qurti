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

SAMPLE_MAP = [
  { "points" : [[0,0],[100,0],[100,200],[0,200]]},
  { "points" : [[150,3],[250,20],[220,220],[120,200]]},
  { "points" : [[340,303],[570,303],[570,420],[340,420]]},
  { "points" : [[ 40,303],[270,303],[270,420],[ 40,420]]},
  { "points" : [[444,104],[497,189],[327,294],[264,218]]},
]

class MapPage(webapp2.RequestHandler):
    def get(self):
        map_name = DEFAULT_MAP_NAME

        devices = Device.query(ancestor=map_key(map_name)).order(Device.clientId).fetch(200)
        rendered_devices = dict(zip([x.key.integer_id() for x in devices], SAMPLE_MAP))

        map_data = {
          "width": 640,
          "height": 480,
          "devices": rendered_devices,
        }
        template_values = {
            "registered_devices": map_data,
        }
        if True:  # self.request.headers.get('Accept') == 'text/json':
            self.response.content_type = "text/json";
            self.response.write(json.dumps(map_data))
        else:
            template = JINJA_ENVIRONMENT.get_template('registration.html')
            self.response.write(template.render(template_values))

application = webapp2.WSGIApplication([
    ('/map', MapPage),
], debug=True)
