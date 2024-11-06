import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Typography from '@mui/material/Typography';
import React from "react";
import Link from '/src/Link';

export default function replaceTemplateWithJSX(template, replacements) {
  const regex = /\{(\w+)\}|(https[:\/a-zA-Z%~0-9-\.]+)/g;
  let result = [];
  let lastIndex = 0;
  let match;
  var i = 0;

  while ((match = regex.exec(template)) !== null) {
    const placeholder = match[0];
    const key = match[1];
    var replacement = undefined;

    if (replacements.hasOwnProperty(key)) {
      replacement = <Typography component='span' key={i++}>{replacements[key]}</Typography>;
    } else if (placeholder.startsWith("https://")) {
      replacement = <Link key={i++} href={placeholder} target="_blank" sx={{ fontSize: "16px" }}>{placeholder}<OpenInNewIcon sx={{ fontSize: "14px", verticalAlign: "middle", marginLeft: "2px" }} /></Link>;
    }

    // Add string before the placeholder
    if (match.index > lastIndex) {
      result.push(<Typography component='span' key={i++}>{template.substring(lastIndex, match.index)}</Typography>);
    }

    if (replacement !== undefined) {
      // Add the replacement, which could be a string or JSX element
      result.push(replacement);
    }

    // Update lastIndex to continue after the current match
    lastIndex = match.index + placeholder.length;
  }

  // Add any remaining string after the last placeholder
  if (lastIndex < template.length) {
    result.push(<Typography component='span' key={i++}>{template.substring(lastIndex)}</Typography>);
  }

  return result;
}
