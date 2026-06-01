import React, { useContext, useState } from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import DifferenceIcon from '@mui/icons-material/Difference';
import { parseFASTA } from './logo/fasta';
import { ProteinAlphabet } from './logo/proteinlogo';
import { tolContext } from './tolContext';

export interface SimpleDialogProps {
  open: boolean;
  onClose: (value: string) => void;
  logoContent: { [key: string]: number[][] | string };
}

function SimpleDialog(props: SimpleDialogProps) {
  const { onClose, open, logoContent } = props;
  const [selections, setSelections] = useState<{ [key: string]: { items: string[], isEqual: boolean } }>({});
  const numEntries = Object.keys(logoContent).length;
  const numColumns = Math.max(0, numEntries - 1);
  const { setCompareDiff } = useContext(tolContext);

  const handleClose = () => {
    setSelections({});
    onClose('');
  };

  const handleCompare = () => {
    const results: number[][] = [];

    Object.entries(selections).forEach(([_, columnData]) => {
      const [item1Key, item2Key] = columnData.items;

      // Convert sequences to PPM format if needed
      const sequence1 = typeof logoContent[item1Key] === 'string'
        ? parseFASTA(ProteinAlphabet, logoContent[item1Key] as string).pfm
        : logoContent[item1Key] as number[][];

      const sequence2 = typeof logoContent[item2Key] === 'string'
        ? parseFASTA(ProteinAlphabet, logoContent[item2Key] as string).pfm
        : logoContent[item2Key] as number[][];

      if (sequence1.length !== sequence2.length) return;

      const differences: number[] = [];

      sequence1.forEach((pos, index) => {
        const maxIndex1 = pos.indexOf(Math.max(...pos));
        const maxIndex2 = sequence2[index].indexOf(Math.max(...sequence2[index]));

        if ((maxIndex1 === maxIndex2) === columnData.isEqual) {
          differences.push(index);
        }
      });

      results.push(differences);
    });

    if (results.length === 0) return;
    const intersectionResults = results.reduce((acc, curr) =>
      acc.filter(num => curr.includes(num)),
      results[0] // initial value prevents crash on single entry
    ).sort((a, b) => a - b);

    const formattedResults = {};

    Object.keys(logoContent).forEach((key, index) => {
      formattedResults[key] = { differing_residues: intersectionResults };
    });

    setCompareDiff(formattedResults);

    onClose('');
  };

  return (
    <Dialog onClose={handleClose} open={open} fullWidth={false} maxWidth="xl">
      <DialogTitle>Sequence Comparison</DialogTitle>
      <p style={{ padding: '0 30px 16px', color: '#555', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
        In each group, select <b>2 logos</b> and choose whether to find <b>differing</b> or <b>identical</b> positions between them.
        Clicking <b>Compare</b> highlights positions that satisfy <b>all</b> active groups simultaneously (intersection).
        Leave a group empty to ignore it.
      </p>
      <div style={{ padding: '0 30px 10px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          {[...Array(numColumns)].map((_, colIndex) => (
            <div key={colIndex} style={{ flex: 1, border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px', minWidth: '200px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Group {colIndex + 1}</h4>
              <p style={{ fontSize: '12px', color: '#666', margin: '0 0 6px 0' }}>
                Selected: {selections[colIndex]?.items?.length || 0} / 2
              </p>
              {Object.keys(logoContent).map((key) => (
                <Button
                  key={key}
                  variant={selections[colIndex]?.items?.includes(key) ? "contained" : "outlined"}
                  onClick={() => {
                    setSelections(prev => {
                      const current = prev[colIndex]?.items || [];
                      if (current.includes(key)) {
                        return {
                          ...prev,
                          [colIndex]: {
                            isEqual: false,
                            items: current.filter(k => k !== key)
                          }
                        };
                      }
                      if (current.length < 2) {
                        return {
                          ...prev,
                          [colIndex]: {
                            isEqual: false,
                            items: [...current, key]
                          }
                        };
                      }
                      return prev;
                    });
                  }}
                  style={{ margin: '5px', width: '100%', textTransform: 'none' }}
                >
                  {key}
                </Button>
              ))}
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: '#555' }}>Show positions that are:</span>
                <Button
                  variant="outlined"
                  size="small"
                  color={selections[colIndex]?.isEqual ? "success" : "warning"}
                  disabled={!selections[colIndex]?.items || selections[colIndex].items.length < 2}
                  onClick={() => setSelections(prev => ({
                    ...prev,
                    [colIndex]: {
                      ...prev[colIndex],
                      isEqual: !prev[colIndex]?.isEqual
                    }
                  }))}
                >
                  {selections[colIndex]?.isEqual ? "identical (==)" : "different (!=)"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', padding: '20px' }}>
        <Button
          variant="outlined"
          onClick={() => {
            setSelections({});
            onClose('');
            setCompareDiff({});
          }}
          color="error"
        >
          Clear All
        </Button>
        <Button
          variant="contained"
          onClick={handleCompare}
          disabled={
            Object.keys(selections).length === 0 ||
            !Object.values(selections).every(col => col.items?.length === 2)
          }
        >
          Compare
        </Button>
      </div>
    </Dialog>
  );
}

interface CompareMenuProps {
  logoContent: { [key: string]: number[][] | string };
}

export default function CompareMenu({ logoContent }: CompareMenuProps) {
  const [open, setOpen] = React.useState<boolean>(false);
  const hasEnough = Object.keys(logoContent).length >= 2;

  return (
    <div>
      <Tooltip title={hasEnough ? "Compare logos" : "Add at least 2 logos to compare"} placement="bottom">
        <span>
          <button
            id="compare-menu-btn"
            className="compare-menu-btn"
            onClick={() => setOpen(true)}
            disabled={!hasEnough}
            style={{ opacity: hasEnough ? 1 : 0.4, cursor: hasEnough ? 'pointer' : 'not-allowed' }}
          >
            <DifferenceIcon />
          </button>
        </span>
      </Tooltip>
      <SimpleDialog
        open={open}
        onClose={() => setOpen(false)}
        logoContent={logoContent}
      />
    </div>
  );
}