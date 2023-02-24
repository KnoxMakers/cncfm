# -*- coding: utf-8 -*-
#
# Copyright (c) 2020 Martin Owens <doctormo@gmail.com>
#                    Sergei Izmailov <sergei.a.izmailov@gmail.com>
#                    Thomas Holder <thomas.holder@schrodinger.com>
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
#
# pylint: disable=arguments-differ
"""
Element interface for patterns, filters, gradients and path effects.
"""
from __future__ import annotations
from typing import List, Tuple, TYPE_CHECKING, Optional

from lxml import etree

from ..transforms import Transform
from ..utils import parse_percent

from ..styles import Style

from ._utils import addNS
from ._base import BaseElement


if TYPE_CHECKING:
    from ._svg import SvgDocumentElement


class Filter(BaseElement):
    """A filter (usually in defs)"""

    tag_name = "filter"

    def add_primitive(self, fe_type, **args):
        """Create a filter primitive with the given arguments"""
        elem = etree.SubElement(self, addNS(fe_type, "svg"))
        elem.update(**args)
        return elem

    class Primitive(BaseElement):
        """Any filter primitive"""

    class Blend(Primitive):
        """Blend Filter element"""

        tag_name = "feBlend"

    class ColorMatrix(Primitive):
        """ColorMatrix Filter element"""

        tag_name = "feColorMatrix"

    class ComponentTransfer(Primitive):
        """ComponentTransfer Filter element"""

        tag_name = "feComponentTransfer"

    class Composite(Primitive):
        """Composite Filter element"""

        tag_name = "feComposite"

    class ConvolveMatrix(Primitive):
        """ConvolveMatrix Filter element"""

        tag_name = "feConvolveMatrix"

    class DiffuseLighting(Primitive):
        """DiffuseLightning Filter element"""

        tag_name = "feDiffuseLighting"

    class DisplacementMap(Primitive):
        """Flood Filter element"""

        tag_name = "feDisplacementMap"

    class Flood(Primitive):
        """DiffuseLightning Filter element"""

        tag_name = "feFlood"

    class GaussianBlur(Primitive):
        """GaussianBlur Filter element"""

        tag_name = "feGaussianBlur"

    class Image(Primitive):
        """Image Filter element"""

        tag_name = "feImage"

    class Merge(Primitive):
        """Merge Filter element"""

        tag_name = "feMerge"

    class Morphology(Primitive):
        """Morphology Filter element"""

        tag_name = "feMorphology"

    class Offset(Primitive):
        """Offset Filter element"""

        tag_name = "feOffset"

    class SpecularLighting(Primitive):
        """SpecularLighting Filter element"""

        tag_name = "feSpecularLighting"

    class Tile(Primitive):
        """Tile Filter element"""

        tag_name = "feTile"

    class Turbulence(Primitive):
        """Turbulence Filter element"""

        tag_name = "feTurbulence"


class Stop(BaseElement):
    """Gradient stop

    .. versionadded:: 1.1"""

    tag_name = "stop"

    @property
    def offset(self) -> float:
        """The offset of the gradient stop"""
        return self.get("offset")

    @offset.setter
    def offset(self, number):
        self.set("offset", number)

    def interpolate(self, other, fraction):
        """Interpolate gradient stops"""
        from ..tween import StopInterpolator

        return StopInterpolator(self, other).interpolate(fraction)


class Pattern(BaseElement):
    """Pattern element which is used in the def to control repeating fills"""

    tag_name = "pattern"
    WRAPPED_ATTRS = BaseElement.WRAPPED_ATTRS + (("patternTransform", Transform),)


class Gradient(BaseElement):
    """A gradient instruction usually in the defs."""

    WRAPPED_ATTRS = BaseElement.WRAPPED_ATTRS + (("gradientTransform", Transform),)
    """Additional to the :attr:`~inkex.elements._base.BaseElement.WRAPPED_ATTRS` of 
    :class:`~inkex.elements._base.BaseElement`, ``gradientTransform`` is wrapped."""

    orientation_attributes = ()  # type: Tuple[str, ...]
    """
    .. versionadded:: 1.1
    """

    @property
    def stops(self):
        """Return an ordered list of own or linked stop nodes

        .. versionadded:: 1.1"""
        gradcolor = (
            self.href
            if isinstance(self.href, (LinearGradient, RadialGradient))
            else self
        )
        return sorted(
            [child for child in gradcolor if isinstance(child, Stop)],
            key=lambda x: parse_percent(x.offset),
        )

    @property
    def stop_offsets(self):
        # type: () -> List[float]
        """Return a list of own or linked stop offsets

        .. versionadded:: 1.1"""
        return [child.offset for child in self.stops]

    @property
    def stop_styles(self):  # type: () -> List[Style]
        """Return a list of own or linked offset styles

        .. versionadded:: 1.1"""
        return [child.style for child in self.stops]

    def remove_orientation(self):
        """Remove all orientation attributes from this element

        .. versionadded:: 1.1"""
        for attr in self.orientation_attributes:
            self.pop(attr)

    def interpolate(
        self,
        other: LinearGradient,
        fraction: float,
        svg: Optional[SvgDocumentElement] = None,
    ):
        """Interpolate with another gradient.

        .. versionadded:: 1.1"""
        from ..tween import GradientInterpolator

        return GradientInterpolator(self, other, svg).interpolate(fraction)

    def stops_and_orientation(self):
        """Return a copy of all the stops in this gradient

        .. versionadded:: 1.1"""
        stops = self.copy()
        stops.remove_orientation()
        orientation = self.copy()
        orientation.remove_all(Stop)
        return stops, orientation


class LinearGradient(Gradient):
    """LinearGradient element"""

    tag_name = "linearGradient"
    orientation_attributes = ("x1", "y1", "x2", "y2")
    """
    .. versionadded:: 1.1
    """

    def apply_transform(self):  # type: () -> None
        """Apply transform to orientation points and set it to identity.
        .. versionadded:: 1.1
        """
        trans = self.pop("gradientTransform")
        pt1 = (
            self.to_dimensionless(self.get("x1")),
            self.to_dimensionless(self.get("y1")),
        )
        pt2 = (
            self.to_dimensionless(self.get("x2")),
            self.to_dimensionless(self.get("y2")),
        )
        p1t = trans.apply_to_point(pt1)
        p2t = trans.apply_to_point(pt2)
        self.update(
            x1=self.to_dimensionless(p1t[0]),
            y1=self.to_dimensionless(p1t[1]),
            x2=self.to_dimensionless(p2t[0]),
            y2=self.to_dimensionless(p2t[1]),
        )


class RadialGradient(Gradient):
    """RadialGradient element"""

    tag_name = "radialGradient"
    orientation_attributes = ("cx", "cy", "fx", "fy", "r")
    """
    .. versionadded:: 1.1
    """

    def apply_transform(self):  # type: () -> None
        """Apply transform to orientation points and set it to identity.

        .. versionadded:: 1.1
        """
        trans = self.pop("gradientTransform")
        pt1 = (
            self.to_dimensionless(self.get("cx")),
            self.to_dimensionless(self.get("cy")),
        )
        pt2 = (
            self.to_dimensionless(self.get("fx")),
            self.to_dimensionless(self.get("fy")),
        )
        p1t = trans.apply_to_point(pt1)
        p2t = trans.apply_to_point(pt2)
        self.update(
            cx=self.to_dimensionless(p1t[0]),
            cy=self.to_dimensionless(p1t[1]),
            fx=self.to_dimensionless(p2t[0]),
            fy=self.to_dimensionless(p2t[1]),
        )


class PathEffect(BaseElement):
    """Inkscape LPE element"""

    tag_name = "inkscape:path-effect"


class MeshGradient(Gradient):
    """Usable MeshGradient XML base class

    .. versionadded:: 1.1"""

    tag_name = "meshgradient"

    @classmethod
    def new_mesh(cls, pos=None, rows=1, cols=1, autocollect=True):
        """Return skeleton of 1x1 meshgradient definition."""
        # initial point
        if pos is None or len(pos) != 2:
            pos = [0.0, 0.0]
        # create nested elements for rows x cols mesh
        meshgradient = cls()
        for _ in range(rows):
            meshrow: BaseElement = meshgradient.add(MeshRow())
            for _ in range(cols):
                meshrow.append(MeshPatch())
        # set meshgradient attributes
        meshgradient.set("gradientUnits", "userSpaceOnUse")
        meshgradient.set("x", pos[0])
        meshgradient.set("y", pos[1])
        if autocollect:
            meshgradient.set("inkscape:collect", "always")
        return meshgradient


class MeshRow(BaseElement):
    """Each row of a mesh gradient

    .. versionadded:: 1.1"""

    tag_name = "meshrow"


class MeshPatch(BaseElement):
    """Each column or 'patch' in a mesh gradient

    .. versionadded:: 1.1"""

    tag_name = "meshpatch"

    def stops(self, edges, colors):
        """Add or edit meshpatch stops with path and stop-color."""
        # iterate stops based on number of edges (path data)
        for i, edge in enumerate(edges):
            if i < len(self):
                stop = self[i]
            else:
                stop = self.add(Stop())

            # set edge path data
            stop.set("path", str(edge))
            # set stop color
            stop.style["stop-color"] = str(colors[i % 2])
