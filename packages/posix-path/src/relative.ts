import { CHAR_FORWARD_SLASH } from './constants';
import { resolve } from './resolve';

export function relative(from: string, to: string) {
    if (from === to) {
        return '';
    }
    from = resolve(from);
    to = resolve(to);
    if (from === to) {
        return '';
    }
    // Trim any leading backslashes
    let fromStart = 1;
    while (fromStart < from.length && from.charCodeAt(fromStart) === CHAR_FORWARD_SLASH) {
        fromStart++;
    }
    const fromEnd = from.length;
    const fromLen = fromEnd - fromStart;
    // Trim any leading backslashes
    let toStart = 1;
    while (toStart < to.length && to.charCodeAt(toStart) === CHAR_FORWARD_SLASH) {
        toStart++;
    }
    const toEnd = to.length;
    const toLen = toEnd - toStart;
    // Compare paths to find the longest common path from root
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for (; i < length; i++) {
        const fromCode = from.charCodeAt(fromStart + i);
        if (fromCode !== to.charCodeAt(toStart + i)) {
            break;
        } else if (fromCode === CHAR_FORWARD_SLASH) {
            lastCommonSep = i;
        }
    }
    if (i === length) {
        if (toLen > length) {
            if (to.charCodeAt(toStart + i) === CHAR_FORWARD_SLASH) {
                // We get here if `from` is the exact base path for `to`.
                // For example: from='/foo/bar'; to='/foo/bar/baz'
                return to.slice(toStart + i + 1);
            }
            if (i === 0) {
                // We get here if `from` is the root
                // For example: from='/'; to='/foo'
                return to.slice(toStart + i);
            }
        } else if (fromLen > length) {
            if (from.charCodeAt(fromStart + i) === CHAR_FORWARD_SLASH) {
                // We get here if `to` is the exact base path for `from`.
                // For example: from='/foo/bar/baz'; to='/foo/bar'
                lastCommonSep = i;
            } else if (i === 0) {
                // We get here if `to` is the root.
                // For example: from='/foo'; to='/'
                lastCommonSep = 0;
            }
        }
    }
    let out = '';
    // Generate the relative path based on the path difference between `to`
    // and `from`
    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
        if (i === fromEnd || from.charCodeAt(i) === CHAR_FORWARD_SLASH) {
            out += out.length === 0 ? '..' : '/..';
        }
    }
    toStart += lastCommonSep;
    // Lastly, append the rest of the destination (`to`) path that comes after
    // the common path parts
    if (out.length > 0) {
        return `${out}${to.slice(toStart)}`;
    }
    if (to.charCodeAt(toStart) === CHAR_FORWARD_SLASH) {
        ++toStart;
    }
    return to.slice(toStart);
}
