import {
    AppBar,
    Button,
    Container,
    IconButton,
    Toolbar,
    Typography,
} from "@mui/material";
import * as React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Home from "~pages/Home";
import "styles.css";
import Navbar from "~util/Navbar";
import WriteupsIndex, { writeups } from "~pages/writeups";
import WriteupsWrapper from "~pages/writeups/wrapper";
import WebApproach from "~pages/WebApproach";
import Reflections from "~pages/Reflections";

export default () => (
    <>
        <Router basename={import.meta.env.BASE_URL}>
            <Navbar />
            <Container
                className="justify-content-center text-center"
                sx={{ pt: 4 }}
            >
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/approach" element={<WebApproach />} />
                    <Route path="/writeups" element={<WriteupsIndex />} />
                    <Route path="/reflections" element={<Reflections />} />
                    {writeups.map((x) => (
                        <Route
                            path={`/writeups/${x.path}`}
                            element={<WriteupsWrapper writeup={x} />}
                        />
                    ))}
                </Routes>
            </Container>
        </Router>
    </>
);
