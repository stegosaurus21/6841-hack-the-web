import { Box, Chip, Container, Divider, Typography } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import * as React from "react";
import IndexCard from "~util/IndexCard";
import { WriteupsApache } from "./apache";
import { WriteupsCOP } from "./cop";
import { WriteupsEaster } from "./easter";
import { WriteupsLove } from "./lovetok";
import { WriteupsNeon } from "./neonify";
import { WriteupsRender } from "./renderquest";
import { WriteupsToxic } from "./toxic";
import { WriteupsWeather } from "./weather";

export const writeups = [
    WriteupsApache,
    WriteupsRender,
    WriteupsNeon,
    WriteupsToxic,
    WriteupsEaster,
    WriteupsLove,
    WriteupsCOP,
    WriteupsWeather,
];

const WriteupsIndex = () => {
    return (
        <Container sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="h4">Writeups</Typography>
            <Typography>
                This page lists the challenges I completed. Click on a challenge
                to see how I went about solving it, as well as my reflection and
                learnings from the solving process!
            </Typography>
            <Box>
                <Typography gutterBottom>
                    Challenges are divided into three difficulty categories,
                    purely based on how challenging I found them.
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                        color="success"
                        label="Easy"
                        sx={{ flex: "0 0 80px" }}
                    />
                    <Typography>
                        Easy challenges were relatively straightforward, with no
                        major sidetracks.
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                        color="warning"
                        label="Medium"
                        sx={{ flex: "0 0 80px" }}
                    />
                    <Typography>
                        Medium challenges had some difficulties, either in
                        researching a new technology stack or implementing a
                        finnicky exploit.
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                        color="error"
                        label="Hard"
                        sx={{ flex: "0 0 80px" }}
                    />
                    <Typography>
                        Hard challenges featured several rabbit holes, with lots
                        of research as well as implementation struggles.
                    </Typography>
                </Box>
            </Box>
            <Divider />
            <Grid container spacing={3}>
                {writeups.map((x) => (
                    <IndexCard title={x.title} link={x.path} tags={x.tags}>
                        {x.description}
                    </IndexCard>
                ))}
            </Grid>
            <Box sx={{ mb: 6 }} />
        </Container>
    );
};

export default WriteupsIndex;
