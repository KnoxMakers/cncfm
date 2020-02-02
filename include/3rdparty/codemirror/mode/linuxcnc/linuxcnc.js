/* Example definition of a simple mode that understands a subset of
 * JavaScript:
 */

CodeMirror.defineSimpleMode("linuxcnc", {
  // The start state contains the rules that are intially used
  start: [
    {regex: /\(.*?\)/, token: "comment"},
    {regex: /M\d+ P\d/, token: "command"},
    {regex: /M\d+ E\d/, token: "command"},
    {regex: /^M\d+/i, token: "command"},
    {regex: /^G\d+/i, token: "command"},
    {regex: /^O\d+ call/i, token: "command"},
    {regex: /X-{0,1}\d+.{0,1}\d*/, token: "variable" },
    {regex: /Y-{0,1}\d+.{0,1}\d*/, token: "variable" },
    {regex: /Z-{0,1}\d+.{0,1}\d*/, token: "variable" },
    {regex: /I-{0,1}\d+.{0,1}\d*/, token: "variable" },
    {regex: /J-{0,1}\d+.{0,1}\d*/, token: "variable" },
    {regex: /[SQF]/, token: "keyword"},
    {regex: /-{0,1}\d+.{0,1}\d*/, token: "number"},
  ]
});

