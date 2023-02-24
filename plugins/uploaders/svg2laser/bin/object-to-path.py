#!/usr/bin/env python3
import inkex

class ObjectToPath(inkex.EffectExtension):

    def parse(self, svg):
        for elem in svg:
            if str(elem) in ['rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon']:
                path = elem.to_path_element()
                elem.replace_with(path)
 
            elif str(elem) in ['text']:
                #print(dir(elem))
                #path = elem.get_path()
                path = elem.to_path_element()
                #print(dir(path))
                elem.replace_with(path)

            elif len(elem.getchildren()) > 0:
                self.parse(elem)

    def effect(self):
       self.parse(self.svg)

if __name__ == '__main__':
    ObjectToPath().run()
