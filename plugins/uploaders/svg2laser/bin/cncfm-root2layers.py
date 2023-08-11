import inkex
from inkex.elements import Group

class CopyObjects(inkex.Effect):
    def __init__(self):
        inkex.Effect.__init__(self)

    def effect(self):
        cncfm_layer = self.svg.add(Group.new('cncfm', is_layer=True))
        for elem in self.document.getroot():
            if elem != cncfm_layer and str(elem) != "layer":
                cncfm_layer.append(elem)


if __name__ == "__main__":
    CopyObjects().run()