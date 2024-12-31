import React, { useState, useRef, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Container,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Box,
} from "@mui/material";

const App = () => {
  const [videoURL, setVideoURL] = useState("");
  const [typedVideoURL, setTypedVideoURL] = useState(""); // Tracks the input field value
  const [captions, setCaptions] = useState([]);
  const [currentCaption, setCurrentCaption] = useState({
    text: "",
    start: "",
    end: "",
  });
  const [videoError, setVideoError] = useState(false); // Track video error state
  const [editingIndex, setEditingIndex] = useState(null); // Track which caption is being edited
  const videoRef = useRef(null);
  const debounceTimeout = useRef(null); // Stores the debounce timeout

  const handleCaptionChange = (e) => {
    const { name, value } = e.target;
    setCurrentCaption((prev) => ({ ...prev, [name]: value }));
  };

  const handleVideoInputChange = (e) => {
    const { value } = e.target;
    setTypedVideoURL(value); // Update typed URL immediately

    // Clear previous debounce timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set new debounce timeout
    debounceTimeout.current = setTimeout(() => {
      setVideoURL(value); // Update actual video URL after delay
    }, 500); // 500ms debounce time
  };

  const addOrUpdateCaption = () => {
    const { text, start, end } = currentCaption;

    if (!text || !start || !end) {
      toast.error("Please fill all fields.");
      return;
    }

    // Convert to numbers for comparison
    const startTime = parseFloat(start);
    const endTime = parseFloat(end);

    if (startTime >= endTime) {
      toast.error("Start time must be less than end time.");
      return;
    }

    // Check for overlap, but skip the caption that's being edited
    const isOverlapping = captions.some(
      (caption, index) =>
        index !== editingIndex && // Skip the editing caption
        ((startTime >= parseFloat(caption.start) &&
          startTime < parseFloat(caption.end)) ||
          (endTime > parseFloat(caption.start) &&
            endTime <= parseFloat(caption.end)) ||
          (startTime <= parseFloat(caption.start) &&
            endTime >= parseFloat(caption.end)))
    );

    if (isOverlapping) {
      toast.error(
        "The specified time range overlaps with an existing caption."
      );
      return;
    }

    if (editingIndex !== null) {
      // Update existing caption
      const updatedCaptions = [...captions];
      updatedCaptions[editingIndex] = currentCaption;
      setCaptions(updatedCaptions);
      setEditingIndex(null); // Clear editing mode
      toast.success("Caption updated successfully!");
    } else {
      // Add new caption
      setCaptions((prev) => [...prev, currentCaption]);
      toast.success("Caption added successfully!");
    }

    setCurrentCaption({ text: "", start: "", end: "" });
  };

  const handleEditCaption = (index) => {
    setCurrentCaption(captions[index]);
    setEditingIndex(index); // Set the index of the caption being edited
  };

  const handleDeleteCaption = (index) => {
    const updatedCaptions = captions.filter((_, idx) => idx !== index);
    setCaptions(updatedCaptions);
    toast.success("Caption deleted successfully!");
  };

  useEffect(() => {
    // Reset captions and current caption when videoURL changes
    setCaptions([]);
    setCurrentCaption({ text: "", start: "", end: "" });
    setVideoError(false); // Reset error state on URL change

    // Reset video element by reloading it when the video URL changes
    if (videoRef.current) {
      videoRef.current.load(); // This will force the video to reload
    }
  }, [videoURL]);

  const handleVideoError = () => {
    setVideoError(true); // Set error state if video fails to load
    toast.error("Failed to load the video. Please check the URL.");
  };

  const generateVTT = () => {
    let vtt = "WEBVTT\n\n";
    captions.forEach((caption, index) => {
      const startTime = formatTime(caption.start);
      const endTime = formatTime(caption.end);
      vtt += `${index + 1}\n${startTime} --> ${endTime}\n${caption.text}\n\n`;
    });
    return URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
  };

  const formatTime = (seconds) => {
    const date = new Date(seconds * 1000);
    const hh = String(date.getUTCHours()).padStart(2, "0");
    const mm = String(date.getUTCMinutes()).padStart(2, "0");
    const ss = String(date.getUTCSeconds()).padStart(2, "0");
    const ms = String(date.getUTCMilliseconds()).padStart(3, "0");
    return `${hh}:${mm}:${ss}.${ms}`;
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(120deg, #a1c4fd, #c2e9fb)",
        color: "#fff",
        padding: 4,
      }}
    >
      <Container maxWidth="md">
        <ToastContainer />
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ color: "black" }}
        >
          Video Caption Editor
        </Typography>
        <Box mb={4}>
          <TextField
            fullWidth
            label="Enter video URL"
            variant="outlined"
            value={typedVideoURL}
            onChange={handleVideoInputChange} // Handle debounced input change
            margin="normal"
          />
          {videoURL && !videoError && (
            <Box my={2}>
              <video
                controls
                ref={videoRef}
                style={{ width: "100%" }}
                onError={handleVideoError} // Attach error handler
              >
                <source src={videoURL} type="video/mp4" />
                {captions.length > 0 && (
                  <track
                    src={generateVTT()}
                    kind="subtitles"
                    srcLang="en"
                    label="English"
                    default
                  />
                )}
              </video>
            </Box>
          )}
          {videoError && (
            <Typography variant="body1" color="error">
              Unable to load the video. Please check the URL.
            </Typography>
          )}
        </Box>

        {videoURL && !videoError && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Add or Edit Captions
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  label="Caption Text"
                  name="text"
                  variant="outlined"
                  value={currentCaption.text}
                  onChange={handleCaptionChange}
                />
                <TextField
                  label="Start Time (seconds)"
                  name="start"
                  type="number"
                  variant="outlined"
                  value={currentCaption.start}
                  onChange={handleCaptionChange}
                />
                <TextField
                  label="End Time (seconds)"
                  name="end"
                  type="number"
                  variant="outlined"
                  value={currentCaption.end}
                  onChange={handleCaptionChange}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={addOrUpdateCaption}
                >
                  {editingIndex !== null ? "Update Caption" : "Add Caption"}
                </Button>
              </Box>
              <Box mt={4}>
                <Typography variant="h6">Captions</Typography>
                <List>
                  {captions.map((caption, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={`${caption.start}s - ${caption.end}s: ${caption.text}`}
                      />
                      <Button
                        variant="text"
                        color="primary"
                        onClick={() => handleEditCaption(index)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="text"
                        color="error"
                        onClick={() => handleDeleteCaption(index)} // Delete button
                      >
                        Delete
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default App;
