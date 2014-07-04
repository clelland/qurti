import os
import json

import webapp2
import jinja2

from google.appengine.ext import ndb

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)

DEFAULT_MAP_NAME = 'default_map'

def map_key(map_name=DEFAULT_MAP_NAME):
    return ndb.Key('Device', map_name)

class Device(ndb.Model):
    ip = ndb.StringProperty(indexed=False)
    clientId = ndb.IntegerProperty()

class RegistrationPage(webapp2.RequestHandler):
    def get(self):
        map_name = DEFAULT_MAP_NAME

        devices = Device.query(ancestor=map_key(map_name)).order(Device.clientId).fetch(200)
        rendered_devices = [{"id": x.key.integer_id(), "ip": x.ip} for x in devices]
        template_values = {
            "registered_devices": rendered_devices,
        }
        if self.request.headers.get('Accept') == 'text/json':
            self.response.content_type = "text/json";
            self.response.write(json.dumps(rendered_devices))
        else:
            template = JINJA_ENVIRONMENT.get_template('registration.html')
            self.response.write(template.render(template_values))

    def post(self):
        map_name = DEFAULT_MAP_NAME

        device = Device(parent=map_key(map_name))
        device.ip = self.request.get('ip')
        key = device.put()
        if self.request.headers.get('Accept') == 'text/json':
            self.response.content_type = "text/plain";
            self.response.write(key.integer_id())
        else:
            self.redirect('/')

class ClearRegistrations(webapp2.RequestHandler):
    def post(self):
        map_name = DEFAULT_MAP_NAME

        devices = Device.query(ancestor=map_key(map_name)).iter(keys_only=True)
        ndb.delete_multi(devices)
        self.redirect('/')

application = webapp2.WSGIApplication([
    ('/', RegistrationPage),
    ('/clear', ClearRegistrations),
], debug=True)
