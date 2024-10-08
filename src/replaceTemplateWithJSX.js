import React from "react";

export default function replaceTemplateWithJSX(template, replacements) {
  const regex = /\{(\w+)\}/g;
  let result = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(template)) !== null) {
    const placeholder = match[0];
    const key = match[1];
    const replacement = replacements[key];

    console.log(match, replacement);

    // Add string before the placeholder
    if (match.index > lastIndex) {
      result.push(template.substring(lastIndex, match.index));
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
    result.push(template.substring(lastIndex));
  }

  return result;
}
