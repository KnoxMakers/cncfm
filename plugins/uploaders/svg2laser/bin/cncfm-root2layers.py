import inkex
from inkex.elements import Group


class CopyObjects(inkex.Effect):
    def __init__(self):
        inkex.Effect.__init__(self)

    def effect(self):
        cncfm_layer = Group.new('cncfm')
        cncfm_layer.set("inkscape:groupmode", "layer")

        for elem in self.document.getroot():
            if elem != cncfm_layer and str(elem) != "layer":
                cncfm_layer.append(elem)

        self.svg.add(cncfm_layer)


if __name__ == "__main__":
    CopyObjects().run()
