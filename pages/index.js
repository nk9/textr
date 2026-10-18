import CancelIcon from '@mui/icons-material/Cancel';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PhoneIcon from '@mui/icons-material/Phone';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Popover from '@mui/material/Popover';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import { getCookie, getCookies, setCookie } from 'cookies-next';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';
import format from 'string-template';
import styles from './index.module.scss';
import AppBar from '/src/AppBar';
import replaceTemplateWithJSX from '/src/replaceTemplateWithJSX';

const Kbd = ({ children }) => {
  return <Box component="span" className={styles.kbd}>{children}</Box>
}

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'left',
  color: theme.palette.text.secondary,
  ...theme.applyStyles('dark', {
    backgroundColor: '#1A2027',
  }),
}));

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    console.log("Text copied to clipboard");
  }).catch((err) => {
    console.error("Failed to copy text: ", err);
  });
}

// Parse one "name<tab or ;>…<tab or ;>number" row, using the first and last
// columns and ignoring any in between
function parseRow(row) {
  var outName = undefined;
  var outNum = undefined;
  var splitChar = '\t';

  if (row.indexOf(';') >= 0) {
    splitChar = ';';
  }

  let columns = row.trim().split(splitChar);
  let rawName = columns[0];
  let rawNum = columns.length >= 2 ? columns[columns.length - 1] : undefined;

  if (rawName && rawName.length >= 2) {
    if (rawName.indexOf(' ') >= 0) {
      let [rawFirst, _] = rawName.split(' ');
      outName = rawFirst
    } else {
      outName = rawName
    }
  }

  if (rawNum && rawNum.length >= 10) {
    let stripped = rawNum.replace(/\D/g, '');

    if (stripped.length >= 10) {
      outNum = `${stripped.slice(0, 3)}-${stripped.slice(3, 6)}-${stripped.slice(6)}`
    }
  }

  return { name: outName, number: outNum };
}

let MY_NAME_COOKIE = 'MY_NAME';
let MESSAGE_TEMPLATE_COOKIE = 'MESSAGE_TEMPLATE';

export const getServerSideProps = ({ req, res, query }) => {
  var defaultMessage = "Hi {firstname}, this is {myname} from One Team Michigan. " +
    "I just wanted to confirm that you'll be canvassing with us today at 3pm. " +
    "Please let me know!";

  const initialMyName = getCookie(MY_NAME_COOKIE, { req, res }) || '';
  const initialMessage = getCookie(MESSAGE_TEMPLATE_COOKIE, { req, res }) || defaultMessage;
  const initialNameNumber = query.to || '';
  const isMac = /Macintosh|Mac OS X/.test(req.headers['user-agent'] || '');

  return { props: { initialMyName, initialMessage, initialNameNumber, isMac } };
};

export default function Index({ initialMyName, initialMessage, initialNameNumber, isMac }) {
  const [myName, setMyName] = useState(initialMyName)
  const [nameNumber, setNameNumber] = useState(initialNameNumber)
  const [rowIndex, setRowIndex] = useState(0)
  const [message, setMessage] = useState(initialMessage)
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [composedMessage, setComposedMessage] = useState('');
  const [plainComposedMessage, setPlainComposedMessage] = useState('');
  const [shrinkName, setShrinkName] = useState(false);
  const [isValidSVG, setIsValidSVG] = useState(false);

  const myNameRef = useRef(null);
  const nameNumberRef = useRef(null);
  const anchorRef = useRef(null);

  const ENVIRONMENT = process.env.NODE_ENV || "development";

  // One person per non-blank line. Keep the index in range as lines are edited.
  const rows = nameNumber.split('\n').filter((row) => row.trim());
  const rowCount = rows.length;
  const currentRow = Math.min(rowIndex, Math.max(rowCount - 1, 0));

  // Wrap around at both ends, so lists can be worked in either direction
  const goToRow = (delta) => {
    if (rowCount > 0) {
      setRowIndex((currentRow + delta + rowCount) % rowCount);
    }
  };

  useEffect(() => {
    if (myName.length > 0) {
      setShrinkName(true);
      nameNumberRef.current.focus();
      nameNumberRef.current.setSelectionRange(nameNumber.length, nameNumber.length);
    } else {
      myNameRef.current.focus();
    }
  }, []);

  const [anchorEl, setAnchorEl] = useState(null);

  // Sync the state of anchorEl with the ref
  useEffect(() => {
    anchorRef.current = anchorEl;
  }, [anchorEl]);

  const handlePopoverOpen = () => {
    let icon = document.getElementById('bigNumberIcon');
    setAnchorEl(icon);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };


  //
  // Set up keyboard shortcuts
  // On Mac, Option+letter types characters into the focused field, but Ctrl+Shift
  // is unused by browsers. Elsewhere, browsers claim Ctrl+Shift, so use Alt+Shift.
  const isShortcutModifier = (event) => isMac
    ? event.ctrlKey && event.shiftKey && !event.altKey && !event.metaKey
    : event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey;

  const handleKeyDown = (event) => {
    console.log("handleKeyDown:", event);
    console.log("validSVG:", isValidSVG);
    if (isShortcutModifier(event) && (event.code === 'Comma' || event.code === 'Period')) {
      event.preventDefault();
      goToRow(event.code === 'Comma' ? -1 : 1);
    }
    else if (isShortcutModifier(event) && event.code === 'KeyQ') {
      event.preventDefault();
      console.log("QR code");
      if (isValidSVG) {
        console.log("validSVG");
        if (!anchorRef.current) {
          handlePopoverOpen();
        } else {
          handlePopoverClose();
        }
      }
    }
    else if (isShortcutModifier(event) && event.code === 'KeyC') {
      event.preventDefault();
      console.log("copy to clipboard");
      if (isValidSVG) {
        console.log("validSVG");
        copyToClipboard(plainComposedMessage);
      }
    }
    else if ((isMac ? event.metaKey : event.ctrlKey) && event.shiftKey && event.key === 'Enter') {
      event.preventDefault();
      console.log("call");
      if (number) {
        let link = document.getElementById("telLink");
        link.click();
      }
    }
    else if ((isMac ? event.metaKey : event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      console.log("send SMS");
      if (isValidSVG) {
        console.log("validSVG");
        let link = document.getElementById("smsLink");
        link.click();
      }
    }
  };

  useEffect(() => {
    // Add event listener for keydown
    window.addEventListener('keydown', handleKeyDown);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isValidSVG, plainComposedMessage, number, currentRow, rowCount]);


  //
  // Create plain and rich versions of composed message
  useEffect(() => {
    let result = replaceTemplateWithJSX(message, {
      myname: <Token key="myname" color='blue'>{myName}</Token>,
      firstname: <Token key="name">{name}</Token>
    });
    setComposedMessage(result)

    let plainResult = format(message, {
      myname: myName,
      firstname: name
    });
    setPlainComposedMessage(plainResult)
  }, [myName, name, message]);

  useEffect(() => {
    let isValid = Boolean(myName && name && number && composedMessage);
    setIsValidSVG(isValid);
  }, [myName, name, number, composedMessage]);

  let smsto = `smsto:${number}:${plainComposedMessage}`

  useEffect(() => {
    let { name, number } = parseRow(rows[currentRow] || '');
    setNumber(number);
    setName(name);
  }, [nameNumber, currentRow])

  useEffect(() => {
    setCookie(MY_NAME_COOKIE, myName, {
      secure: ENVIRONMENT === "production",
      sameSite: ENVIRONMENT === "production" ? "none" : "lax"
    })
    setShrinkName(myName.length > 0);
  }, [myName])

  useEffect(() => {
    setCookie(MESSAGE_TEMPLATE_COOKIE, message, { 
      secure: ENVIRONMENT === "production",
      sameSite: ENVIRONMENT === "production" ? "none" : "lax"
    })
  }, [message])

  const messageChanged = (event) => {
    setMessage(event.target.value)
  }

  let fakeQRCode = "https://apple.com";
  let smsURL = `sms://${number};?&body=${encodeURIComponent(plainComposedMessage)}`;
  let instructions = (<>
    <Box sx={{ mb: 3 }}><PhotoCameraIcon fontSize='small' sx={{ verticalAlign: "middle", mr: 1 }} />Scan below, or <Link id="smsLink" href={smsURL}>directly send a text</Link></Box>
  </>);

  const open = Boolean(anchorEl);
  const qrcodeIcon = (<QrCodeIcon
    id="bigNumberIcon"
    aria-owns={open ? 'big-number-popover' : undefined}
    aria-haspopup="true"
    onMouseEnter={handlePopoverOpen}
    onMouseLeave={handlePopoverClose}
    fontSize='inherit'
    sx={{ position: 'relative', top: '2px' }} />)

  return (
    <>
      <AppBar />
      <Container maxWidth="md" mb={3}>
        <Grid container spacing={{ md: 4, sm: 3 }}>
          <Grid size={6}>
            <Box>
              <TextField
                value={myName}
                inputRef={myNameRef}
                label="My Name"
                variant="outlined"
                InputLabelProps={{ shrink: shrinkName }}
                onChange={(e) => setMyName(e.target.value)} />
              <IconButton aria-label="delete" size="large" onClick={() => setMyName('')}>
                <CancelIcon fontSize="inherit" />
              </IconButton>
            </Box>
            <Box sx={{ mt: 4, maxwidth: '350px', display: 'flex' }}>
              <Box sx={{ width: '370px' }}>
                <TextField
                  value={nameNumber}
                  inputRef={nameNumberRef}
                  label="Their names & cell numbers"
                  variant="outlined"
                  multiline
                  minRows={2}
                  maxRows={8}
                  fullWidth
                  onChange={(e) => setNameNumber(e.target.value)} />
              </Box>
              <IconButton aria-label="delete" size="large" onClick={() => { setNameNumber(''); setRowIndex(0); }}>
                <CancelIcon fontSize="inherit" />
              </IconButton>
            </Box>
            {rowCount > 1 &&
              <Box sx={{ display: 'flex', alignItems: 'center', width: '370px', justifyContent: 'center' }}>
                <IconButton aria-label="previous person" onClick={() => goToRow(-1)}>
                  <ChevronLeftIcon />
                </IconButton>
                {currentRow + 1} of {rowCount}
                <IconButton aria-label="next person" onClick={() => goToRow(1)}>
                  <ChevronRightIcon />
                </IconButton>
              </Box>}
            (Name & number, separated by tab or semicolon. One person per line. You can paste in rows from Google Sheets. Middle columns are ignored.)
            <Box sx={{ my: 4, maxwidth: '350px' }}>
              <TextField
                value={message}
                id="text-message"
                label="Text message template"
                multiline
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                fullWidth
              />
            </Box>
            <Box sx={{ my: 4 }}>
              Available tokens: <Token><tt>{'{'}firstname{'}'}</tt></Token>, <Token color="blue"><tt>{'{'}myname{'}'}</tt></Token>
            </Box>
          </Grid>
          <Grid size={{ md: 6, sm: 6 }}>
            <Item>
              <Grid container spacing={1}>
                <Grid size={{ xs: 3, md: 2 }} sx={{ textAlign: 'right', fontWeight: 'bold' }}>To:</Grid>
                <Grid size={{ xs: 9, md: 10 }}>{number && <Link id="telLink" href={`tel:${number}`}>{number}</Link>} {number && qrcodeIcon}</Grid>
                <Grid size={{ xs: 3, md: 2 }} sx={{ textAlign: 'right', fontWeight: 'bold' }}>Message:</Grid>
                <Grid size={{ xs: 9, md: 10 }}>{composedMessage}</Grid>
              </Grid>
            </Item>
            <Box sx={{ my: 4, display: "flex", justifyContent: "center", flexWrap: "wrap" }}>
              {isValidSVG ? instructions : ''}
              <Box sx={{ position: 'relative' }}>
                <QRCodeSVG
                  value={isValidSVG ? smsto : fakeQRCode}
                  size={256}
                  fgColor={isValidSVG ? "black" : "lightgray"} />
                {!isValidSVG ? <Typography sx={{ position: 'absolute', top: '50px', left: '0', zIndex: '2', fontWeight: 'bold', color: 'blue', fontSize: '40pt', WebkitTextStrokeColor: "white", WebkitTextStrokeWidth: "4px", paintOrder: "stroke fill", textAlign: 'center' }}>Fill in all fields</Typography> : ''}
              </Box>
            </Box>
          </Grid>
        </Grid>
        <Container sx={{ display: "flex", justifyContent: "center" }}>
          <Grid container maxWidth="520px" columnSpacing={1} rowSpacing={2} sx={{ position: "relative", whiteSpace: "nowrap" }}>
            <Grid size={12} sx={{ fontSize: "16pt", fontweight: "600", textAlign: "center", borderBottom: "solid 2px", borderBottomColor: "primary.main" }}>Shortcuts</Grid>
            <Grid size={6} sx={{ textAlign: "right", verticalAlign: "baseline" }} pt={1}>send SMS:</Grid>
            <Grid size={6} pt={1}><Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>+<Kbd>Enter</Kbd></Grid>
            <Grid size={6} sx={{ textAlign: "right" }}>copy message:</Grid>
            <Grid size={6}><Kbd>{isMac ? 'Ctrl' : 'Alt'}</Kbd>+<Kbd>Shift</Kbd>+<Kbd>C</Kbd></Grid>
            <Grid size={6} sx={{ textAlign: "right" }}>call:</Grid>
            <Grid size={6}><Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>+<Kbd>Shift</Kbd>+<Kbd>Enter</Kbd></Grid>
            <Grid size={6} sx={{ textAlign: "right" }}>previous/next person:</Grid>
            <Grid size={6}><Kbd>{isMac ? 'Ctrl' : 'Alt'}</Kbd>+<Kbd>Shift</Kbd>+<Kbd>&lt;</Kbd> / <Kbd>&gt;</Kbd></Grid>
            <Grid size={6} sx={{ textAlign: "right" }}>show call QR code:</Grid>
            <Grid size={6}><Kbd>{isMac ? 'Ctrl' : 'Alt'}</Kbd>+<Kbd>Shift</Kbd>+<Kbd>Q</Kbd></Grid>
          </Grid>
        </Container>
      </Container>
      <Popover
        id="big-number-popover"
        sx={{ pointerEvents: 'none' }}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 360, height: 408 }}>
          {/* Icon sits 40px above the QR code, well clear of its quiet zone */}
          <PhoneIcon sx={{ position: 'absolute', bottom: 'calc(50% + 50px + 40px)', fontSize: 48, color: 'black' }} />
          <QRCodeSVG
            value={`tel:${number};`}
            size={100}
            fgColor='black'
          />
          <Typography sx={{ position: 'absolute', top: 'calc(50% + 50px + 16px)', width: '100%', textAlign: "center" }}>ctrl+shift+q</Typography>
        </Box>
      </Popover>
    </>
  );
}

function Token({ children, color = "orangered" }) {
  return (
    <Box component="span" sx={{ color: { color }, fontWeight: "bold" }}>
      {children}
    </Box>
  )
}
