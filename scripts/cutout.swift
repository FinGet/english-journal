// Person cut-out for covers (SERIES.md §1.10), using Apple Vision person segmentation (macOS).
// usage: swift scripts/cutout.swift <frame.png> <out.png>   (absolute paths; writes a transparent PNG)
import AppKit
import CoreImage
import Vision

let args = CommandLine.arguments
let input = CIImage(contentsOf: URL(fileURLWithPath: args[1]))!
let handler = VNImageRequestHandler(ciImage: input)
let req = VNGeneratePersonSegmentationRequest()
req.qualityLevel = .accurate
req.outputPixelFormat = kCVPixelFormatType_OneComponent8
try handler.perform([req])
let maskBuf = req.results!.first!.pixelBuffer
var mask = CIImage(cvPixelBuffer: maskBuf)
mask = mask.transformed(by: CGAffineTransform(scaleX: input.extent.width / mask.extent.width, y: input.extent.height / mask.extent.height))
let blend = CIFilter(name: "CIBlendWithMask")!
blend.setValue(input, forKey: kCIInputImageKey)
blend.setValue(CIImage.empty(), forKey: kCIInputBackgroundImageKey)
blend.setValue(mask, forKey: kCIInputMaskImageKey)
let ctx = CIContext()
let out = blend.outputImage!
let cg = ctx.createCGImage(out, from: input.extent)!
let rep = NSBitmapImageRep(cgImage: cg)
try rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: args[2]))
print("ok \(cg.width)x\(cg.height)")
