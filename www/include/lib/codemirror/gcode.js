
CodeMirror.defineSimpleMode("gcode", {
  // The start state contains the rules that are intially used
  start: [
    {regex: /\(.*?\)/, token: "comment"},
    {regex: /M\d+ P\d/, token: "keyword"},
    {regex: /M\d+ E\d/, token: "keyword"},
    {regex: /^M\d+/i, token: "keyword"},
    {regex: /^G\d+/i, token: "keyword"},
    {regex: /^O\d+ call/i, token: "keyword"},
    {regex: /X-{0,1}\d+.{0,1}\d*/, token: "variable" },
    {regex: /Y-{0,1}\d+.{0,1}\d*/, token: "variable" },
    {regex: /Z-{0,1}\d+.{0,1}\d*/, token: "variable" },
    {regex: /I-{0,1}\d+.{0,1}\d*/, token: "variable" },
    {regex: /J-{0,1}\d+.{0,1}\d*/, token: "variable" },
    {regex: /[SQF]/, token: "keyword"},
    {regex: /-{0,1}\d+.{0,1}\d*/, token: "number"},
  ]
});

