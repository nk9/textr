import CancelIcon from '@mui/icons-material/Cancel';
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

let MY_NAME_COOKIE = 'MY_NAME_COOKIE';
let MESSAGE_COOKIE = 'MESSAGE_COOKIE';

export const getServerSideProps = ({ req, res, query }) => {
  var defaultMessage = "Hi {firstname}, this is {myname} from the Michigan ONE Campaign. " +
    "I just wanted to confirm that you'll be canvassing with us today at 3pm. " +
    "Please let me know!";

  const initialMyName = getCookie(MY_NAME_COOKIE, { req, res }) || '';
  const initialMessage = getCookie(MESSAGE_COOKIE, { req, res }) || defaultMessage;
  const initialNameNumber = query.to || '';

  return { props: { initialMyName, initialMessage, initialNameNumber } };
};

export default function Index({ initialMyName, initialMessage, initialNameNumber }) {
  const [myName, setMyName] = useState(initialMyName)
  const [nameNumber, setNameNumber] = useState(initialNameNumber)
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
  const handleKeyDown = (event) => {
    console.log("handleKeyDown:", event);
    console.log("validSVG:", isValidSVG);
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyQ') {
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
    else if (event.ctrlKey && event.shiftKey && event.code === 'KeyC') {
      event.preventDefault();
      console.log("copy to clipboard");
      if (isValidSVG) {
        console.log("validSVG");
        copyToClipboard(plainComposedMessage);
      }
    }
    else if (event.ctrlKey && event.shiftKey && event.code === 'KeyS') {
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
  }, []);


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
    var outName = undefined;
    var outNum = undefined;
    var splitChar = '\t';

    if (nameNumber.indexOf(';') >= 0) {
      splitChar = ';';
    }

    let [rawName, rawNum] = nameNumber.split(splitChar)

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
      outNum = `${stripped.slice(0, 3)}-${stripped.slice(3, 6)}-${stripped.slice(6)}`
    }

    setNumber(outNum);
    setName(outName);
  }, [nameNumber])

  useEffect(() => {
    setCookie(MY_NAME_COOKIE, myName, {
      secure: ENVIRONMENT === "production",
      sameSite: ENVIRONMENT === "production" ? "none" : "lax"
    })
    setShrinkName(myName.length > 0);
  }, [myName])

  useEffect(() => {
    setCookie(MESSAGE_COOKIE, message, { 
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
    fontSize='inherit' />)

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
                  label="Their name & cell number"
                  variant="outlined"
                  fullWidth
                  onChange={(e) => setNameNumber(e.target.value)} />
              </Box>
              <IconButton aria-label="delete" size="large" onClick={() => setNameNumber('')}>
                <CancelIcon fontSize="inherit" />
              </IconButton>
            </Box>
            (Separated by tab or semicolon. You can paste in the two cells from Google Sheets.)
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
                <Grid size={{ xs: 9, md: 10 }}>{number} {number && qrcodeIcon}</Grid>
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
                {!isValidSVG ? <Typography sx={{ position: 'absolute', top: '50px', left: '0', zIndex: '2', fontWeight: 'bold', color: 'blue', fontSize: '40pt', WebkitTextStrokeColor: "white", WebkitTextStrokeWidth: "2px", textAlign: 'center' }}>Fill in all fields</Typography> : ''}
              </Box>
            </Box>
          </Grid>
        </Grid>
        <Container sx={{ display: "flex", justifyContent: "center" }}>
          <Grid container maxWidth="400px" columnSpacing={1} rowSpacing={2} sx={{ position: "relative" }}>
            <Grid size={12} sx={{ fontSize: "16pt", fontweight: "600", textAlign: "center", borderBottom: "solid 2px", borderBottomColor: "primary.main" }}>Shortcuts</Grid>
            <Grid size={{ xs: 6, md: 5 }} sx={{ textAlign: "right", verticalAlign: "baseline" }} pt={1}>send SMS:</Grid>
            <Grid size={{ xs: 6, md: 5 }} pt={1}><Kbd>Ctrl</Kbd>+<Kbd>Shift</Kbd>+<Kbd>S</Kbd></Grid>
            <Grid size={{ xs: 6, md: 5 }} sx={{ textAlign: "right" }}>copy message:</Grid>
            <Grid size={{ xs: 6, md: 5 }}><Kbd>Ctrl</Kbd>+<Kbd>Shift</Kbd>+<Kbd>C</Kbd></Grid>
            <Grid size={{ xs: 6, md: 5 }} sx={{ textAlign: "right" }}>show QR code:</Grid>
            <Grid size={{ xs: 6, md: 5 }}><Kbd>Ctrl</Kbd>+<Kbd>Shift</Kbd>+<Kbd>Q</Kbd></Grid>
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
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5, pb: 3, flexDirection: 'column' }}>
          <QRCodeSVG
            value={`tel:${number};`}
            size={100}
            fgColor='black'
          />
          <Typography sx={{ textAlign: "center", pt: 2 }}>ctrl+shift+q</Typography>
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
