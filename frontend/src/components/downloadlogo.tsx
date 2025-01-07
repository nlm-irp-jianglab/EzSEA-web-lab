import React, { useContext } from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';

const emails = ['username@gmail.com', 'user02@gmail.com'];

export interface SimpleDialogProps {
  open: boolean;
  onClose: (value: string) => void;
  seqLength: number;
}

function downloadCombinedSVG(left: number = 0, right: number = 10): void {
  const svgElements = document.querySelectorAll<SVGSVGElement>('#logo-stack svg');

  if (svgElements.length === 0) {
    console.error("No SVG elements found!");
    return;
  }

  // Create a new SVG element that will contain all the others
  const combinedSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  combinedSVG.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  // Positioning variables
  let yOffset = 0;

  svgElements.forEach((svg, index) => {
    // Get actual height, no viewbox height of svg
    const height = svg.getBoundingClientRect().height;

    // Create a group element to contain the svg
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Adjust the position of the SVG using a transform
    g.setAttribute("transform", `translate(0, ${yOffset})`);

    const clonedSVG = svg.cloneNode(true) as SVGSVGElement;
    const glyphs = Array.from(clonedSVG.children[0].children) as SVGGElement[];
    const xlab = Array.from(clonedSVG.children[1].children[0].children) as SVGGElement[];

    // Get viewBox dimensions
    const viewBox = clonedSVG.getAttribute('viewBox')!.split(' ');
    console.log(viewBox)
    const aspectRatio = parseFloat(viewBox[2]) / parseFloat(viewBox[3]);
    const totalWidth = height * aspectRatio;

    clonedSVG.setAttribute('width', totalWidth.toString());

    // Create array of indices to remove (those outside left-right range)
    const indicesToRemove = [...Array(glyphs.length).keys()]
      .filter(i => i < left || i > right);

    // Remove glyphs from highest index to lowest to avoid shifting issues
    indicesToRemove.reverse().forEach(index => {
      glyphs[index].remove();
      xlab[index].remove();
    });

    // Get the translation for the first glyph
    const transformMatch = glyphs[left].getAttribute('transform')!.match(/translate\(([^,]+),/);
    if (!transformMatch) {
      console.error("Transform attribute is missing or does not match the expected pattern.");
      return;
    }
    const glyphXTranslation = transformMatch[1];
    const xlabXTranslation = xlab[left].getAttribute('y')!;

    // Apply xtransform to glyph container, xlab
    clonedSVG.children[0].setAttribute('transform', `translate(-${parseFloat(glyphXTranslation) - 80}, 0)`);
    clonedSVG.children[1].setAttribute('transform', `translate(-${parseFloat(xlabXTranslation) - 130}, 452.2)`);

    // Append the group element into the combined SVG
    g.appendChild(clonedSVG);
    combinedSVG.appendChild(g);

    // Update yOffset for the next svg to be placed below the current one
    yOffset += parseFloat(height.toString());
  });

  const logoBBox = svgElements[0].getBBox();
  combinedSVG.setAttribute("width", logoBBox.width.toString());
  combinedSVG.setAttribute("height", "100%");

  // Serialize the combined SVG to a string
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(combinedSVG);

  const styleString = `
  <style>
      .glyphrect {
          fill-opacity: 0.0;
      }
      svg {
          overflow: visible !important;
      }
      * {
          overflow: visible !important;
      }
  </style>`;
  svgString = svgString.replace('</svg>', `${styleString}</svg>`);

  // Create a blob for the SVG data
  const blob = new Blob([svgString], { type: 'image/svg+xml' });

  // Create a download link
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = `combined.svg`; // Name of the downloaded file

  // Trigger the download
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink); // Clean up
}

function SimpleDialog(props: SimpleDialogProps) {
  const { onClose, open, seqLength } = props;
  const [value, setValue] = React.useState<number[]>([0, 10]);
  const handleChange = (event: Event, newValue: number | number[]) => {
    setValue(newValue as number[]);
  };

  const handleClose = () => {
    onClose('');
  };

  const handleDownloadClick = () => {
    onClose('');
    downloadCombinedSVG(value[0], value[1]);
  };

  return (
    <Dialog onClose={handleClose} open={open} fullWidth={true}>
      <DialogTitle>Download Range:</DialogTitle>
      <div style={{ padding: '30px' }}>
        <Slider
          value={value}
          onChange={handleChange}
          valueLabelDisplay="auto"
          disableSwap
          max={seqLength}
        />
      </div>
      <br />
      <Button variant="outlined" onClick={handleDownloadClick}>
        Download
      </Button>
    </Dialog>
  );
}

export default function DownloadDialog({ seqLength }: { seqLength: number }) {
  const [open, setOpen] = React.useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = (value: string) => {
    setOpen(false);
  };

  React.useEffect(() => {
    const button = document.getElementById('download-stack-btn');
    if (button) {
      button.addEventListener('click', handleClickOpen);
    }
    return () => {
      if (button) {
        button.removeEventListener('click', handleClickOpen);
      }
    };
  }, []);

  return (
    <div>
      <SimpleDialog
        open={open}
        onClose={() => setOpen(false)}
        seqLength={seqLength}
      />
    </div>
  );
}