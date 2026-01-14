/* PrismJS Bash/Shell Language Bundle */
(function (Prism) {
  Prism.languages.bash = {
    'shebang': {
      pattern: /^#!\s*\/.*$/,
      alias: 'important'
    },
    'comment': {
      pattern: /(^|[^"{\\])#.*/,
      lookbehind: true
    },
    'string': [
      {
        pattern: /(["'])(?:\\[\s\S]|\$\([^)]+\)|`[^`]+`|(?!\1)[^\\])*\1/,
        greedy: true
      },
      {
        pattern: /(["'])(?:\\[\s\S]|\$\([^)]+\)|`[^`]+`|(?!\1)[^\\])*\1/,
        greedy: true
      }
    ],
    'variable': [
      {
        pattern: /\$[a-zA-Z_][a-zA-Z0-9_]*/,
        greedy: true
      },
      {
        pattern: /\$\{[a-zA-Z_][a-zA-Z0-9_]*\}/,
        greedy: true
      }
    ],
    'function': {
      pattern: /\b[a-zA-Z_][a-zA-Z0-9_]*\s*\(\)/,
      greedy: true
    },
    'keyword': /\b(?:if|then|else|elif|fi|case|esac|for|select|while|until|do|done|in|function|local|export|declare|typeset|readonly|unset|shift|set|test|let|eval|exec|exit|return|break|continue|trap|signal|kill|wait|jobs|bg|fg|disown|builtin|command|type|hash|alias|unalias|bind|setattr|getattr|pushd|popd|dirs|shopt|printf|read|readarray|mapfile|source|\.)\b/,
    'builtin': /\b(?:cd|pwd|ls|cat|echo|printf|read|readarray|mapfile|mkdir|rmdir|rm|cp|mv|ln|touch|chmod|chown|chgrp|umask|df|du|mount|umount|ps|top|kill|killall|pkill|pgrep|nice|renice|ionice|nohup|screen|tmux|su|sudo|whoami|id|groups|passwd|chpasswd|usermod|useradd|userdel|groupadd|groupdel|w|uptime|free|vmstat|iostat|sar|netstat|ss|ping|traceroute|nslookup|dig|host|wget|curl|scp|rsync|ssh|telnet|ftp|sftp|tftp|nc|netcat|socat|tcpdump|wireshark|tshark|iptables|firewall-cmd|ufw|systemctl|service|chkconfig|update-rc.d|crontab|at|batch|find|locate|grep|sed|awk|cut|sort|uniq|wc|head|tail|less|more|cat|tee|tr|rev|fmt|fold|paste|join|split|csplit|comm|diff|patch|tar|gzip|bzip2|xz|zip|unzip|rar|7z|mount|umount|fdisk|parted|mkfs|fsck|e2fsck|dumpe2fs|tune2fs|resize2fs|mkswap|swapon|swapoff|cryptsetup|luks|lvm|vgcreate|vgextend|vgreduce|vgremove|lvcreate|lvextend|lvreduce|lvremove|pvcreate|pvremove|mdadm|raid|grub|grub2|efibootmgr|update-grub|kernel|modules|depmod|modprobe|rmmod|lsmod|dmesg|journalctl|logrotate|rsyslog|syslog|logger|wall|write|mesg|talk|mail|mailx|sendmail|postfix|dovecot|openssh|openssl|gnupg|gpg|ssh-keygen|ssh-copy-id|ssh-agent|ssh-add|git|svn|hg|cvs|bzr|make|gcc|g\+\+|clang|ld|ar|ranlib|strip|objdump|nm|gdb|valgrind|strace|ltrace|perf|oprofile|cachegrind|callgrind|massif|helgrind|drd|sgcheck|memcheck|addrcheck|leakcheck|racecheck|threadcheck|exp-ptrcheck|exp-sgcheck|exp-bbv|bbv-hash|lackey|none|minimal|default|full|yes|no|on|off|true|false|enable|disable|start|stop|restart|reload|status|active|inactive|enabled|disabled|loaded|unloaded|present|absent|installed|removed|up|down|running|stopped|exited|failed|unknown)\b/,
    'operator': /&&|\|\||;;|<<|>>|<>|<|>|=|!=|==|<=|>=|!|~|\?|\*|\+|\-|\||&|;|\(|\)|\\|\||\^|\$|\@|\%|\#|\{|\}|\[|\]|:|,|\./,
    'punctuation': /[{}[\];(),.]/,
    'number': /\b\d+\b/,
    'command': {
      pattern: /\b[a-zA-Z_][a-zA-Z0-9_]*\b(?=\s|$)/,
      greedy: true
    }
  };

  Prism.languages.shell = Prism.languages.bash;
  Prism.languages.sh = Prism.languages.bash;

}(Prism));